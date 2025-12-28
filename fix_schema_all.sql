-- RUN THIS IN NEON SQL EDITOR

-- 1. Fix Applications Table (Rename createdAt -> submittedAt)
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'createdAt') THEN
      ALTER TABLE applications RENAME COLUMN "createdAt" TO "submittedAt";
  END IF;
END $$;

-- 2. Verify Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    "read" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Verify Users Column
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isProfileComplete" BOOLEAN DEFAULT false;

-- 4. Verify Page Views
CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    "userId" VARCHAR(255),
    "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
