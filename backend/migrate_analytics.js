import { query } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        console.log("Migrating Analytics...");
        await query(`
            CREATE TABLE IF NOT EXISTS page_views (
                id SERIAL PRIMARY KEY,
                path VARCHAR(255) NOT NULL,
                "userId" VARCHAR(255),
                "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Analytics table created.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
