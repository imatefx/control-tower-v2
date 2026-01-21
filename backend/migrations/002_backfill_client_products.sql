-- Migration: Backfill client productIds from existing deployments
-- Date: 2026-01-21
-- Description: Populates clients.product_ids based on existing deployments
--              Each client gets unique products from their deployments

-- First, let's see what we're working with
SELECT 'Before migration:' as status;
SELECT
  c.name as client_name,
  c.product_ids,
  (SELECT COUNT(*) FROM deployments d WHERE d.client_id = c.id AND d.deleted_at IS NULL) as deployment_count
FROM clients c
WHERE c.deleted_at IS NULL
ORDER BY c.name
LIMIT 10;

-- Create a temp table with the aggregated product_ids per client
CREATE TEMP TABLE client_product_mapping AS
SELECT
  d.client_id,
  jsonb_agg(DISTINCT d.product_id) as product_ids
FROM deployments d
WHERE d.client_id IS NOT NULL
  AND d.product_id IS NOT NULL
  AND d.deleted_at IS NULL
GROUP BY d.client_id;

-- Update clients with product_ids from deployments
UPDATE clients c
SET product_ids = cpm.product_ids
FROM client_product_mapping cpm
WHERE c.id = cpm.client_id
  AND c.deleted_at IS NULL;

-- Show results
SELECT 'After migration:' as status;
SELECT
  c.name as client_name,
  jsonb_array_length(COALESCE(c.product_ids, '[]'::jsonb)) as product_count,
  c.product_ids
FROM clients c
WHERE c.deleted_at IS NULL
  AND jsonb_array_length(COALESCE(c.product_ids, '[]'::jsonb)) > 0
ORDER BY c.name;

-- Summary
SELECT
  'Summary' as info,
  (SELECT COUNT(*) FROM clients WHERE deleted_at IS NULL) as total_clients,
  (SELECT COUNT(*) FROM clients WHERE deleted_at IS NULL AND jsonb_array_length(COALESCE(product_ids, '[]'::jsonb)) > 0) as clients_with_products,
  (SELECT COUNT(*) FROM deployments WHERE deleted_at IS NULL) as total_deployments;

-- Cleanup
DROP TABLE IF EXISTS client_product_mapping;
