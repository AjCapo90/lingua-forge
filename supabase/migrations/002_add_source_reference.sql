-- ============================================================
-- Migration: Add source_reference to items table
-- Version: 002
-- Date: 2026-02-07
-- ============================================================

-- Add source_reference column for tracking book page/unit references
ALTER TABLE items ADD COLUMN IF NOT EXISTS source_reference TEXT;

-- Create index for source queries (optional, for debugging/browsing)
CREATE INDEX IF NOT EXISTS idx_items_source ON items(source);

-- Comment for documentation
COMMENT ON COLUMN items.source_reference IS 'Page number or unit reference from source material (e.g., "page 70", "unit 15")';
