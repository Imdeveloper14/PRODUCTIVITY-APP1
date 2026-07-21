import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Check table schema
  const { data: columns, error: schemaError } = await supabase
    .from('clients')
    .select('*')
    .limit(0);

  const { data: { user } } = await supabase.auth.getUser();

  // 2. Try a test insert with minimal required fields
  const testRecord = {
    name: '__test_diagnostic__',
    phone: '',
    email: '',
    company: '',
    notes: '',
    project_history: 'None yet',
    agreement_documents: [],
    ...(user?.id ? { user_id: user.id } : {})
  };

  const { data: insertData, error: insertError } = await supabase
    .from('clients')
    .insert([testRecord])
    .select();

  // 3. Clean up test record if insert succeeded
  if (insertData && insertData[0]?.id) {
    await supabase.from('clients').delete().eq('id', insertData[0].id);
  }

  return Response.json({
    env: {
      url: supabaseUrl ? 'PRESENT' : 'MISSING',
      key: supabaseKey ? 'PRESENT' : 'MISSING'
    },
    schemaCheck: {
      error: schemaError ? {
        message: schemaError.message,
        code: schemaError.code,
        details: schemaError.details,
        hint: schemaError.hint
      } : null,
      success: !schemaError
    },
    insertTest: {
      success: !insertError,
      error: insertError ? {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      } : null,
      insertedId: insertData?.[0]?.id || null
    }
  });
}
