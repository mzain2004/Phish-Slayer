import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security/safeCompare";
import { logAuditEvent } from "@/lib/audit/auditLogger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // Auth via CRON_SECRET
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !safeCompare(token, cronSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // STEP 1: Fetch all opted-in user profiles in ONE query
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id, 
        email, 
        display_name,
        tenant_users (
          tenant_id
        )
      `)
      .eq("notify_digest", true);

    if (profileError) throw profileError;

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        sent: 0,
        errors: 0,
        message: "No users opted in",
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    
    // STEP 2: Extract all their user_ids and org_ids into arrays
    const userIds = profiles.map(p => p.id);
    const orgIds = Array.from(new Set(profiles.flatMap(p => (p.tenant_users as any[] || []).map(tu => tu.tenant_id))));

    // STEP 3: Run ONE bulk query for scan counts grouped by user_id for the past 7 days
    const { data: allScans, error: scanError } = await supabaseAdmin
      .from("scans")
      .select("user_id, verdict")
      .in("user_id", userIds)
      .gte("date", sevenDaysAgo);
    
    if (scanError) throw scanError;

    // STEP 5: Run ONE bulk query for incident counts grouped by org_id
    const { data: allIncidents, error: incidentError } = await supabaseAdmin
      .from("incidents")
      .select("organization_id, status")
      .in("organization_id", orgIds)
      .neq("status", "Resolved");
    
    if (incidentError) throw incidentError;

    // STEP 6: Run ONE bulk query for top threats grouped by org_id (fetching all malicious for grouping)
    const { data: allThreats, error: threatError } = await supabaseAdmin
      .from("scans")
      .select("user_id, target, risk_score")
      .in("user_id", userIds)
      .eq("verdict", "malicious")
      .gte("date", sevenDaysAgo)
      .order("risk_score", { ascending: false });

    if (threatError) throw threatError;

    // Build Maps for stats
    const scanCountMap = new Map<string, number>();
    const maliciousCountMap = new Map<string, number>();
    const topThreatsMap = new Map<string, any[]>();
    const incidentCountMap = new Map<string, number>();

    allScans?.forEach(scan => {
      scanCountMap.set(scan.user_id, (scanCountMap.get(scan.user_id) || 0) + 1);
      if (scan.verdict === 'malicious') {
        maliciousCountMap.set(scan.user_id, (maliciousCountMap.get(scan.user_id) || 0) + 1);
      }
    });

    allThreats?.forEach(threat => {
      const userThreats = topThreatsMap.get(threat.user_id) || [];
      if (userThreats.length < 3) {
        userThreats.push({ target: threat.target, risk_score: threat.risk_score });
        topThreatsMap.set(threat.user_id, userThreats);
      }
    });

    allIncidents?.forEach(inc => {
      if (inc.organization_id) {
        incidentCountMap.set(inc.organization_id, (incidentCountMap.get(inc.organization_id) || 0) + 1);
      }
    });

    let sent = 0;
    let errors = 0;

    // STEP 7: Loop over profiles and use the pre-fetched Map to build each user's digest payload — NO DB calls inside this loop
    for (const profile of profiles) {
      try {
        const totalScans = scanCountMap.get(profile.id) || 0;
        const maliciousCount = maliciousCountMap.get(profile.id) || 0;
        const topThreats = topThreatsMap.get(profile.id) || [];
        
        // Sum incidents for all orgs the user is in
        const userOrgs = (profile.tenant_users as any[] || []).map(tu => tu.tenant_id);
        const openIncidents = userOrgs.reduce((acc, orgId) => acc + (incidentCountMap.get(orgId) || 0), 0);

        // Log the digest
        await supabaseAdmin.from("audit_logs").insert([
          {
            user_id: profile.id,
            action: "weekly_digest_sent",
            resource_type: "digest",
            organization_id: userOrgs[0] || null, // Primary org for audit logging
            severity: "low",
            payload: {
              totalScans,
              maliciousCount,
              openIncidents,
              topThreats,
            },
            metadata: {
              user_email: profile.email,
              user_role: "system",
            },
          },
        ]);

        sent++;
      } catch (err) {
        console.error(`Digest error for ${profile.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({ sent, errors, total: profiles.length });
  } catch (err: any) {
    console.error("Weekly digest error:", err);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
