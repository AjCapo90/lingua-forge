import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzxwhykawnaetdvhifpl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eHdoeWthd25hZXRkdmhpZnBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQwMjA4MSwiZXhwIjoyMDg1OTc4MDgxfQ.s6ViwDXkWnGBMExZZyfj439N0GDjYIDQrDKfE_stlYs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  // Try inserting WITHOUT source_reference first
  console.log('Testing insert without source_reference...');
  
  const { data, error } = await supabase.from('items').insert({
    target_language: 'en',
    type: 'vocabulary',
    content: 'test_item_delete_me',
    cefr_level: 'A1',
    source: 'test'
  }).select();
  
  if (error) {
    console.log('❌ Basic insert failed:', error.message);
  } else {
    console.log('✅ Basic insert works! ID:', data[0].id);
    console.log('   Columns available:', Object.keys(data[0]).join(', '));
    
    // Clean up
    await supabase.from('items').delete().eq('content', 'test_item_delete_me');
    console.log('   Cleaned up test item.');
  }
}

runMigration();
