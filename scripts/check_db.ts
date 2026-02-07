import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzxwhykawnaetdvhifpl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eHdoeWthd25hZXRkdmhpZnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NjY3MzksImV4cCI6MjA1NDQ0MjczOX0.L-xKW2syRxM5YQDNz6E6Q8N8oB8nPE6zzRJlQWxHGy8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  // Check items count
  const { count, error } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true });
  
  console.log('Items table:');
  console.log('  Count:', count ?? 0);
  if (error) console.log('  Error:', error.message);
  
  // Try to get a sample item to see schema
  const { data: sample } = await supabase
    .from('items')
    .select('*')
    .limit(1);
  
  if (sample && sample.length > 0) {
    console.log('  Columns:', Object.keys(sample[0]).join(', '));
  }
}

check();
