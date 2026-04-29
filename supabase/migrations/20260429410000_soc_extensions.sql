-- SOC Extension Columns
ALTER TABLE asset_inventory ADD COLUMN IF NOT EXISTS criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('low','medium','high','critical'));
ALTER TABLE asset_inventory ADD COLUMN IF NOT EXISTS asset_tags TEXT[] DEFAULT '{}';

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS queue_priority INTEGER DEFAULT 50;
-- Critical=100, High=75, Medium=50, Low=25, Deferred=10
