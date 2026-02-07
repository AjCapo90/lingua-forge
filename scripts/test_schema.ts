import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzxwhykawnaetdvhifpl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eHdoeWthd25hZXRkdmhpZnBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQwMjA4MSwiZXhwIjoyMDg1OTc4MDgxfQ.s6ViwDXkWnGBMExZZyfj439N0GDjYIDQrDKfE_stlYs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
  // First, add the source_reference column if it doesn't exist
  const { error: alterError } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE items ADD COLUMN IF NOT EXISTS source_reference TEXT;'
  });
  
  if (alterError) {
    console.log('Note: Could not run ALTER (may need manual migration):', alterError.message);
  }

  // Try inserting a test item
  const { data, error } = await supabase.from('items').insert({
    target_language: 'en',
    type: 'vocabulary',
    content: 'test_item_delete_me',
    cefr_level: 'A1',
    source: 'test',
    source_reference: 'page 1'
  }).select();
  
  if (error) {
    console.log('❌ Insert failed:', error.message);
    if (error.message.includes('source_reference')) {
      console.log('   → Need to add source_reference column manually');
    }
  } else {
    console.log('✅ Schema is ready!');
    // Clean up
    await supabase.from('items').delete().eq('content', 'test_item_delete_me');
    console.log('   Test item cleaned up.');
  }
}

test();
