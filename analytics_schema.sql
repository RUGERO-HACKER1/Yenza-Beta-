-- Add Enhanced Analytics Columns
ALTER TABLE page_views 
ADD COLUMN IF NOT EXISTS "ip" VARCHAR(45),
ADD COLUMN IF NOT EXISTS "country" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "referrer" TEXT,
ADD COLUMN IF NOT EXISTS "device" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "browser" VARCHAR(50);

-- Index for performance on aggregations
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views("timestamp");
