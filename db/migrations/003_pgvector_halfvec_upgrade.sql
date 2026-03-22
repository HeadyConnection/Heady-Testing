-- ═══════════════════════════════════════════════════════════════
-- HEADY™ Migration 003 — pgvector halfvec(1536) Upgrade
-- Zero-downtime migration from 384D float32 → 1536D halfvec
--
-- Targets: memory_documents table (infra/postgres schema)
-- Prerequisites: pgvector >= 0.7.0
--
-- Run against Neon staging branch first, then promote to prod.
-- ═══════════════════════════════════════════════════════════════

-- Verify pgvector version supports halfvec
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'halfvec') THEN
    RAISE EXCEPTION 'pgvector >= 0.7.0 required for halfvec support. Current version does not support halfvec.';
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 1: Add new halfvec(1536) columns alongside existing 384D
-- Dual-write begins at application level after this phase.
-- ═══════════════════════════════════════════════════════════════

-- memory_documents: main vector memory table
ALTER TABLE memory_documents
  ADD COLUMN IF NOT EXISTS embedding_1536 halfvec(1536);

-- Add 1536D columns to core tables that still use 384D anywhere
-- (core_schema already uses VECTOR(1536), but ensure halfvec option exists)

-- ═══════════════════════════════════════════════════════════════
-- PHASE 2: Create HNSW indexes on new columns (CONCURRENTLY)
-- Run these in separate transactions for zero-downtime.
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_memory_docs_hnsw_1536
  ON memory_documents USING hnsw (embedding_1536 halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ═══════════════════════════════════════════════════════════════
-- PHASE 3: Backfill helper function
-- Call from application layer in batches of 100K rows.
-- Re-embed via text-embedding-3-small (1536D) and write to
-- embedding_1536 column.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION backfill_halfvec_batch(
  batch_size INT DEFAULT 1000,
  sleep_seconds FLOAT DEFAULT 0.1
)
RETURNS TABLE(processed INT, remaining BIGINT) AS $$
DECLARE
  rows_updated INT;
  rows_left BIGINT;
BEGIN
  -- Mark rows needing backfill (embedding_1536 IS NULL but embedding IS NOT NULL)
  -- Actual embedding computation must happen in the application layer.
  -- This function reports progress only.
  SELECT COUNT(*) INTO rows_left
    FROM memory_documents
    WHERE embedding IS NOT NULL
      AND embedding_1536 IS NULL;

  rows_updated := 0;
  processed := rows_updated;
  remaining := rows_left;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 4: Seamless fallback view during transition
-- Application queries this view instead of the raw table.
-- Returns halfvec if available, falls back to original embedding.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW memory_documents_v2 AS
SELECT
  id,
  namespace,
  content,
  COALESCE(embedding_1536, embedding::halfvec(384)) AS embedding,
  CASE WHEN embedding_1536 IS NOT NULL THEN 1536 ELSE 384 END AS embedding_dim,
  projection_x,
  projection_y,
  projection_z,
  metadata,
  created_at,
  updated_at
FROM memory_documents;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 5: Finalization (run AFTER all rows backfilled)
-- Uncomment and run manually once backfill is 100% complete.
-- ═══════════════════════════════════════════════════════════════

-- DROP INDEX IF EXISTS memory_documents_embedding_idx;
-- ALTER TABLE memory_documents DROP COLUMN embedding;
-- ALTER TABLE memory_documents RENAME COLUMN embedding_1536 TO embedding;

-- Rebuild search function for 1536D halfvec
CREATE OR REPLACE FUNCTION search_memory_halfvec(
  query_embedding halfvec(1536),
  target_namespace TEXT DEFAULT NULL,
  result_limit INT DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  doc_id UUID,
  doc_namespace TEXT,
  doc_content TEXT,
  similarity FLOAT,
  doc_metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS doc_id,
    m.namespace AS doc_namespace,
    m.content AS doc_content,
    (1 - (m.embedding_1536 <=> query_embedding))::FLOAT AS similarity,
    m.metadata AS doc_metadata
  FROM memory_documents m
  WHERE m.embedding_1536 IS NOT NULL
    AND (target_namespace IS NULL OR m.namespace = target_namespace)
    AND (1 - (m.embedding_1536 <=> query_embedding)) >= similarity_threshold
  ORDER BY m.embedding_1536 <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- MONITORING QUERIES (for ops during migration)
-- ═══════════════════════════════════════════════════════════════

-- Check migration progress:
-- SELECT
--   COUNT(*) FILTER (WHERE embedding_1536 IS NOT NULL) AS migrated,
--   COUNT(*) FILTER (WHERE embedding_1536 IS NULL AND embedding IS NOT NULL) AS pending,
--   COUNT(*) AS total,
--   ROUND(100.0 * COUNT(*) FILTER (WHERE embedding_1536 IS NOT NULL) / NULLIF(COUNT(*), 0), 2) AS pct_complete
-- FROM memory_documents;

-- Check index build status:
-- SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE indexrelname LIKE '%1536%';

COMMENT ON COLUMN memory_documents.embedding_1536 IS 'halfvec(1536) via text-embedding-3-small — 50% storage savings vs float32';
