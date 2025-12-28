import { query } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const migrate = async () => {
    try {
        console.log("Running migration...");
        // Add isProfileComplete
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "isProfileComplete" BOOLEAN DEFAULT false');
        console.log("✅ Added isProfileComplete column");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
