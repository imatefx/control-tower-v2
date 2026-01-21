-- Migration: Add alert_config and notification_emails columns
-- Date: 2026-01-21
-- Description: Adds alerting/notification columns to deployments and products tables

-- =====================================================
-- DEPLOYMENTS TABLE
-- =====================================================

-- Add alert_config column to deployments table
ALTER TABLE deployments
ADD COLUMN IF NOT EXISTS alert_config JSONB DEFAULT '{
  "enabled": true,
  "notifyProductOwners": true,
  "notifyEngineeringOwners": true,
  "notifyDeliveryLead": true,
  "additionalEmails": [],
  "googleChat": {
    "enabled": false,
    "webhookUrl": null,
    "useProductWebhook": true
  },
  "events": {
    "onCreated": true,
    "onStatusChange": true,
    "onBlocked": true,
    "onReleased": true,
    "onApproaching": true,
    "onOverdue": true
  }
}'::jsonb;

-- Add notification_emails column to deployments table (if not exists)
ALTER TABLE deployments
ADD COLUMN IF NOT EXISTS notification_emails TEXT[] DEFAULT '{}';

-- Add last_notification_sent column to deployments table (if not exists)
ALTER TABLE deployments
ADD COLUMN IF NOT EXISTS last_notification_sent JSONB DEFAULT '{}';

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================

-- Add alert_config column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS alert_config JSONB DEFAULT '{
  "googleChatWebhookUrl": null,
  "defaultNotifyOwners": true
}'::jsonb;

-- Add notification_emails column to products table (if not exists)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS notification_emails TEXT[] DEFAULT '{}';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify columns were added (this will show column info)
SELECT
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name IN ('deployments', 'products')
  AND column_name IN ('alert_config', 'notification_emails', 'last_notification_sent')
ORDER BY table_name, column_name;
