/**
 * Seed script to import vocabulary_master.json into Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://fzxwhykawnaetdvhifpl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eHdoeWthd25hZXRkdmhpZnBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQwMjA4MSwiZXhwIjoyMDg1OTc4MDgxfQ.s6ViwDXkWnGBMExZZyfj439N0GDjYIDQrDKfE_stlYs';
const BATCH_SIZE = 500;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface VocabularyItem {
  content: string;
  type: string;
  definition: string | null;
  examples: string[];
  cefr_level: string;
  source: string;
  source_reference?: string;
}

interface VocabularyFile {
  metadata: {
    total: number;
    by_cefr: Record<string, number>;
    by_type: Record<string, number>;
  };
  items: VocabularyItem[];
}

async function seedVocabulary() {
  console.log('🚀 Starting vocabulary import...\n');

  const filePath = path.join(__dirname, '../data/en/vocabulary_master.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data: VocabularyFile = JSON.parse(rawData);

  console.log('📊 Source file:');
  console.log(`   Total items: ${data.metadata.total}`);
  console.log(`   By CEFR:`, data.metadata.by_cefr);
  console.log(`   By Type:`, data.metadata.by_type);
  console.log('');

  // Check existing count
  const { count: existingCount } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true });

  if (existingCount && existingCount > 0) {
    console.log(`⚠️  Items table has ${existingCount} existing rows. Clearing...`);
    await supabase.from('items').delete().neq('id', 0);
    console.log('   Cleared.\n');
  }

  // Transform items (skip source_reference for now - column doesn't exist)
  const dbItems = data.items.map((item) => ({
    target_language: 'en',
    type: item.type,
    content: item.content,
    definition: item.definition || null,
    examples: item.examples && item.examples.length > 0 ? item.examples : null,
    cefr_level: item.cefr_level,
    source: item.source,
    // Note: source_reference skipped - add column later if needed
  }));

  console.log(`📦 Inserting ${dbItems.length} items in batches of ${BATCH_SIZE}...\n`);

  let inserted = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < dbItems.length; i += BATCH_SIZE) {
    const batch = dbItems.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(dbItems.length / BATCH_SIZE);
    const pct = Math.round((i / dbItems.length) * 100);

    process.stdout.write(`\r   [${pct}%] Batch ${batchNum}/${totalBatches}...`);

    const { data: insertedData, error } = await supabase
      .from('items')
      .insert(batch)
      .select('id');

    if (error) {
      console.log(`\n❌ Batch error: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += insertedData?.length || batch.length;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\r   [100%] Done!                              `);
  console.log('\n' + '═'.repeat(50));
  console.log(`✅ Import complete in ${elapsed}s`);
  console.log(`   Inserted: ${inserted.toLocaleString()}`);
  if (errors > 0) console.log(`   Errors: ${errors}`);
  console.log('═'.repeat(50));

  // Verify final counts
  const { count: finalCount } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Database now has: ${finalCount?.toLocaleString()} items`);

  // Breakdown by type
  for (const type of ['vocabulary', 'phrasal_verb', 'collocation', 'idiom', 'expression']) {
    const { count } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('type', type);
    console.log(`   ${type}: ${count?.toLocaleString()}`);
  }

  // Breakdown by CEFR
  console.log('\n   By CEFR level:');
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    const { count } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('cefr_level', level);
    if (count && count > 0) console.log(`   ${level}: ${count.toLocaleString()}`);
  }
}

seedVocabulary().catch(console.error);
