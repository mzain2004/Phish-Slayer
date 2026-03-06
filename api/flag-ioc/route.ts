import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const flagIocSchema = z.object({
  ioc: z.string().min(1, 'IOC is required'),
  type: z.enum(['ip', 'url', 'domain', 'hash']),
  source: z.literal('agent'),
  description: z.string().optional(),
});

type FlagIocRequest = z.infer<typeof flagIocSchema>;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validationResult = flagIocSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const parsedBody: FlagIocRequest = validationResult.data;

    // 3. Insert into scans table
    // Assuming 'scans' table has columns: id (uuid), target, user_id, status, created_at
    const { data: scanData, error: insertError } = await supabase
      .from('scans')
      .insert({
        target: parsedBody.ioc,
        // Optional: you can store type, source, and description if your schema supports them
        // type: parsedBody.type,
        // source: parsedBody.source,
        // description: parsedBody.description,
        status: 'pending',
        // created_at is typically handled automatically by Supabase default values (now()), 
        // but can be explicitly passed if your schema requires it.
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[flag-ioc] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create scan record' }, { status: 500 });
    }

    // 4. Return success response
    return NextResponse.json({ 
      success: true, 
      scanId: scanData.id 
    }, { status: 201 });

  } catch (error) {
    console.error('[flag-ioc] Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
