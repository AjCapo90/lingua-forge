/**
 * Calculate and store priority scores in frequency_rank column
 * With pagination to handle all 16,434 items
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzxwhykawnaetdvhifpl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eHdoeWthd25hZXRkdmhpZnBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQwMjA4MSwiZXhwIjoyMDg1OTc4MDgxfQ.s6ViwDXkWnGBMExZZyfj439N0GDjYIDQrDKfE_stlYs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================
// WEIGHT DEFINITIONS
// ============================================================

const CEFR_WEIGHTS: Record<string, number> = {
  'A1': 100, 'A2': 85, 'B1': 70, 'B2': 55, 'C1': 40, 'C2': 25,
};

const SOURCE_WEIGHTS: Record<string, number> = {
  'Oxford 3000': 35,
  'Oxford 5000': 30,
  'English Phrasal Verbs in Use': 28,
  'English Vocabulary in Use Pre-intermediate and Intermediate': 25,
  'English Collocations in Use Intermediate': 22,
  'English Idioms in Use Intermediate': 20,
  'English Vocabulary in Use Upper-intermediate': 18,
  'English Collocations in Use Advanced': 15,
  'English Phrasal Verbs in Use Advanced': 15,
  'English Idioms in Use Advanced': 12,
  'Business Vocabulary in Use Intermediate': 10,
  'Academic Vocabulary in Use': 8,
};

const TYPE_WEIGHTS: Record<string, number> = {
  'phrasal_verb': 18, 'collocation': 15, 'vocabulary': 12, 'idiom': 10, 'expression': 10,
};

function calculatePriority(item: { cefr_level: string; source: string; type: string }): number {
  return (CEFR_WEIGHTS[item.cefr_level] || 50) + 
         (SOURCE_WEIGHTS[item.source] || 10) + 
         (TYPE_WEIGHTS[item.type] || 10);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🚀 Calculating priority scores...\n');
  
  // Fetch ALL items with pagination
  let allItems: any[] = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('items')
      .select('id, cefr_level, source, type, content')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error) {
      console.error('Error fetching:', error.message);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allItems = allItems.concat(data);
    console.log(`   Fetched page ${page + 1}: ${data.length} items (total: ${allItems.length})`);
    page++;
  }
  
  console.log(`\n📊 Total items: ${allItems.length.toLocaleString()}\n`);
  
  // Calculate priorities
  const updates = allItems.map(item => ({
    id: item.id,
    content: item.content,
    priority: calculatePriority(item),
    cefr: item.cefr_level,
    type: item.type,
    source: item.source
  }));
  
  // Distribution
  const dist: Record<number, number> = {};
  updates.forEach(u => {
    const bucket = Math.floor(u.priority / 10) * 10;
    dist[bucket] = (dist[bucket] || 0) + 1;
  });
  
  console.log('📈 Priority distribution:');
  Object.keys(dist).map(Number).sort((a, b) => b - a).forEach(bucket => {
    const bar = '█'.repeat(Math.ceil(dist[bucket] / 300));
    console.log(`   ${bucket.toString().padStart(3)}-${(bucket+9).toString().padEnd(3)}: ${dist[bucket].toString().padStart(5)} ${bar}`);
  });
  
  // Update database
  console.log('\n💾 Updating database...');
  const startTime = Date.now();
  let updated = 0;
  
  const BATCH_SIZE = 50;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const pct = Math.round((i / updates.length) * 100);
    process.stdout.write(`\r   [${pct}%] ${i.toLocaleString()}/${updates.length.toLocaleString()}...`);
    
    await Promise.all(batch.map(async (u) => {
      const { error } = await supabase
        .from('items')
        .update({ frequency_rank: u.priority })
        .eq('id', u.id);
      if (!error) updated++;
    }));
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\r   [100%] ✅ Updated ${updated.toLocaleString()} items in ${elapsed}s\n`);
  
  // Top items
  console.log('🏆 TOP 15 Items to Learn First:');
  updates.sort((a, b) => b.priority - a.priority).slice(0, 15).forEach((item, i) => {
    console.log(`   ${(i+1).toString().padStart(2)}. [${item.priority}] "${item.content}" (${item.type}, ${item.cefr})`);
  });
  
  console.log('\n🎯 Top B1/B2 Phrasal Verbs (your level!):');
  updates
    .filter(u => u.type === 'phrasal_verb' && ['B1', 'B2'].includes(u.cefr))
    .slice(0, 10)
    .forEach((item, i) => {
      console.log(`   ${(i+1).toString().padStart(2)}. [${item.priority}] "${item.content}"`);
    });
  
  console.log('\n📚 Top B1/B2 Vocabulary:');
  updates
    .filter(u => u.type === 'vocabulary' && ['B1', 'B2'].includes(u.cefr))
    .slice(0, 10)
    .forEach((item, i) => {
      console.log(`   ${(i+1).toString().padStart(2)}. [${item.priority}] "${item.content}"`);
    });

  console.log('\n💬 Top B1/B2 Collocations:');
  updates
    .filter(u => u.type === 'collocation' && ['B1', 'B2'].includes(u.cefr))
    .slice(0, 10)
    .forEach((item, i) => {
      console.log(`   ${(i+1).toString().padStart(2)}. [${item.priority}] "${item.content}"`);
    });
  
  // Summary
  console.log('\n📊 Summary by level:');
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    const items = updates.filter(u => u.cefr === level);
    if (items.length > 0) {
      const avg = items.reduce((s, u) => s + u.priority, 0) / items.length;
      console.log(`   ${level}: ${items.length.toLocaleString().padStart(5)} items, avg priority ${avg.toFixed(0)}`);
    }
  }
  
  console.log('\n📊 Summary by type:');
  for (const type of ['vocabulary', 'phrasal_verb', 'collocation', 'idiom', 'expression']) {
    const items = updates.filter(u => u.type === type);
    const avg = items.reduce((s, u) => s + u.priority, 0) / items.length;
    console.log(`   ${type.padEnd(15)}: ${items.length.toLocaleString().padStart(5)} items, avg ${avg.toFixed(0)}`);
  }
}

main().catch(console.error);
