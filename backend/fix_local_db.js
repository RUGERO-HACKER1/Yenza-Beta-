import { query } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        console.log("Fixing Local Database Schema...");

        // 1. Rename createdAt -> submittedAt in applications
        try {
            await query(`ALTER TABLE applications RENAME COLUMN "createdAt" TO "submittedAt"`);
            console.log("✅ Renamed createdAt to submittedAt in applications.");
        } catch (err) {
            if (err.code === '42703') {
                // undefined_column: maybe already renamed or doesn't exist
                console.log("ℹ️ Column rename skipped (maybe already done or column missing).");
            } else {
                console.log("ℹ️ usage: " + err.message);
            }
        }

        // 2. Ensure Messages table exists
        await query(`
             CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255),
                message TEXT NOT NULL,
                "read" BOOLEAN DEFAULT false,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Verified Messages table.");

        // 3. Ensure Page Views
        await query(`
            CREATE TABLE IF NOT EXISTS page_views (
                id SERIAL PRIMARY KEY,
                path VARCHAR(255) NOT NULL,
                "userId" VARCHAR(255),
                "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Verified Page Views table.");

        console.log("✅ Local Fix Complete. Restart Server.");
        process.exit(0);
    } catch (err) {
        console.error("Fix Failed:", err);
        process.exit(1);
    }
};
run();
