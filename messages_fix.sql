-- RUN THIS IN NEON SQL EDITOR TO ENABLE MESSAGES

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    "read" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: Messages sent BEFORE this table exists were lost (500 Error).
-- After running this, new messages will appear in your Admin Dashboard.
