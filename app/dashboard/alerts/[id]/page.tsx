import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@clerk/nextjs/server";

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return notFound();

  const { id } = await params;

  const supabase = await createClient();
  // Simplified org fetching, in a real app would be from user context
  const { data: alert } = await supabase.from("alerts").select("*").eq("id", id).single();

  if (!alert) return notFound();

  const enrichment = alert.enrichment || {};
  const ips = enrichment.ips || [];
  const domains = enrichment.domains || [];
  const hashes = enrichment.hashes || [];
  const assets = enrichment.assets || [];
  const users = enrichment.users || [];

  return (
    <div className="p-8 space-y-6 bg-[#0a0a0f] text-white min-h-screen font-inter">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Alert Detail: {alert.id}</h1>
        <div className="flex items-center space-x-4">
          <Badge className="bg-[#7c6af7] text-white rounded-[4px] px-3 py-1">
            {alert.severity} ({alert.queue_priority})
          </Badge>
          <button className="bg-[#7c6af7] hover:bg-[#6b58e6] text-white rounded-[4px] px-4 py-2 font-medium transition-colors">
            Take Action
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Severity Breakdown */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-[#00d4aa]">Severity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Base Score</span>
                <span className="text-white">{alert.rule_level || 0}</span>
              </div>
              {/* Note: in a full implementation we would store the breakdown in alert DB */}
              <div className="flex justify-between text-[#00d4aa] font-bold pt-2">
                <span>Final Queue Priority</span>
                <span>{alert.queue_priority || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Context */}
        {assets.length > 0 && (
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-[#00d4aa]">Asset Context</CardTitle>
            </CardHeader>
            <CardContent>
              {assets.map((a: any, i: number) => (
                <div key={i} className="space-y-2 mb-4 last:mb-0 border-b border-white/10 last:border-0 pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-mono text-white text-lg">{a.hostname}</span>
                    <Badge variant="outline" className="text-xs">Crit: {a.criticality}</Badge>
                    {a.is_shadow_it && <Badge className="bg-red-500/20 text-red-300">Shadow IT</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-400 block text-xs uppercase tracking-wider">Network Zone</span> <span className="font-medium text-white">{a.network_zone || 'Unknown'}</span></div>
                    <div><span className="text-gray-400 block text-xs uppercase tracking-wider">Owner</span> <span className="font-medium text-white">{a.owner_team || 'Unknown'}</span></div>
                    <div className="col-span-2">
                      <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Data Classification</span>
                      <div className="flex gap-2">
                        {a.data_classification?.length > 0 
                          ? a.data_classification.map((c: string) => <Badge key={c} variant="secondary" className="bg-white/10">{c}</Badge>)
                          : <span className="text-gray-500">None</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* User Context */}
        {users.length > 0 && (
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-[#00d4aa]">User Context</CardTitle>
            </CardHeader>
            <CardContent>
              {users.map((u: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-white text-lg">{u.username}</span>
                    {u.is_privileged && <Badge className="bg-orange-500/20 text-orange-300">Privileged</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div><span className="text-gray-400 block text-xs uppercase tracking-wider">Department</span> <span className="text-white">{u.department || 'Unknown'}</span></div>
                    <div><span className="text-gray-400 block text-xs uppercase tracking-wider">Role</span> <span className="text-white">{u.role || 'Unknown'}</span></div>
                    <div><span className="text-gray-400 block text-xs uppercase tracking-wider">Risk Score</span> <span className="font-mono text-[#00d4aa]">{u.account_risk_score || 0}</span></div>
                    <div><span className="text-gray-400 block text-xs uppercase tracking-wider">MFA</span> <span className="text-white">{u.mfa_status || 'Unknown'}</span></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Network IOCs */}
      {(ips.length > 0 || domains.length > 0) && (
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl mt-6">
          <CardHeader>
            <CardTitle className="text-xl text-[#00d4aa]">Network Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400 uppercase text-xs">Type</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs">Indicator</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs">Reputation</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ips.map((ip: any, i: number) => (
                  <TableRow key={`ip-${i}`} className="border-white/10 hover:bg-white/5">
                    <TableCell><Badge variant="outline" className="text-xs border-white/20 text-gray-300">IP</Badge></TableCell>
                    <TableCell className="font-mono text-white">{ip.ip}</TableCell>
                    <TableCell>
                      {ip.is_internal ? (
                        <Badge className="bg-blue-500/20 text-blue-300">Internal</Badge>
                      ) : (
                        <div className="flex gap-2">
                          {ip.virustotal?.malicious > 0 && <Badge className="bg-red-500/20 text-red-300">VT: {ip.virustotal.malicious}</Badge>}
                          {ip.abuseipdb?.confidence_score > 0 && <Badge className="bg-orange-500/20 text-orange-300">Abuse: {ip.abuseipdb.confidence_score}%</Badge>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-300">
                      {!ip.is_internal && ip.maxmind?.country ? `${ip.maxmind.city || ''}, ${ip.maxmind.country} (ASN: ${ip.asn || 'Unknown'})` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {domains.map((d: any, i: number) => (
                  <TableRow key={`dom-${i}`} className="border-white/10 hover:bg-white/5">
                    <TableCell><Badge variant="outline" className="text-xs border-white/20 text-gray-300">DOMAIN</Badge></TableCell>
                    <TableCell className="font-mono text-white">{d.domain}</TableCell>
                    <TableCell>
                      {d.virustotal?.malicious > 0 && <Badge className="bg-red-500/20 text-red-300">VT: {d.virustotal.malicious}</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-300">
                      {d.whois?.is_new && <Badge className="bg-yellow-500/20 text-yellow-300 mr-2">New Domain</Badge>}
                      {d.dga_score > 50 && <Badge className="bg-orange-500/20 text-orange-300">High DGA Score</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* File Hashes */}
      {hashes.length > 0 && (
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl mt-6">
          <CardHeader>
            <CardTitle className="text-xl text-[#00d4aa]">File Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400 uppercase text-xs">Type</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs">Hash</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs">Reputation</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs">Family / Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hashes.map((h: any, i: number) => (
                  <TableRow key={`hash-${i}`} className="border-white/10 hover:bg-white/5">
                    <TableCell><Badge variant="outline" className="text-xs border-white/20 text-gray-300 uppercase">{h.type}</Badge></TableCell>
                    <TableCell className="font-mono text-sm text-white break-all">{h.hash}</TableCell>
                    <TableCell>
                      {h.virustotal?.malicious > 0 && <Badge className="bg-red-500/20 text-red-300">VT: {h.virustotal.malicious}</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-300">
                      {h.virustotal?.family && <span className="font-medium text-[#7c6af7] mr-2">{h.virustotal.family}</span>}
                      {h.virustotal?.file_type}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
    </div>
  );
}
