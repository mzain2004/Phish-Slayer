import { supabaseAdmin } from '@/lib/supabase/admin';

export interface OnCallMember {
    user_id: string;
    email: string;
    slack_id?: string;
}

export async function getCurrentOnCall(orgId: string, rotationId: string): Promise<OnCallMember | null> {
    const { data: rotation, error } = await supabaseAdmin
        .from('on_call_rotations')
        .select('*')
        .eq('id', rotationId)
        .eq('org_id', orgId)
        .single();

    if (error || !rotation || !rotation.members || rotation.members.length === 0) {
        return null;
    }

    const now = new Date();
    const handoffTime = new Date(rotation.handoff_time);

    if (now >= handoffTime) {
        // Time for handoff
        const nextIndex = (rotation.current_index + 1) % rotation.members.length;
        const nextHandoff = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours

        await supabaseAdmin
            .from('on_call_rotations')
            .update({
                current_index: nextIndex,
                handoff_time: nextHandoff.toISOString()
            })
            .eq('id', rotationId);

        return rotation.members[nextIndex];
    }

    return rotation.members[rotation.current_index];
}
