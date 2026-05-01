import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAllIntegrations } from '@/lib/integrations/registry';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const integrations = getAllIntegrations();
  const supabase = await createClient();

  const { data: connected } = await supabase
    .from('connector_configs')
    .select('vendor, connector_type')
    .eq('organization_id', orgId);

  const result = integrations.map(integration => ({
    ...integration,
    is_connected: connected?.some(c => 
      c.vendor.toLowerCase() === integration.id.toLowerCase() || 
      c.vendor.toLowerCase() === integration.vendor.toLowerCase()
    ) || false
  }));

  return NextResponse.json(result);
}
