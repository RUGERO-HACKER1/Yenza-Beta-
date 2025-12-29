import { query, initDB } from '../backend/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log("Initializing DB...");
        // initDB() might be needed if it sets up the pool

        const sqlPath = path.join(__dirname, '../analytics_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Applying schema update from:", sqlPath);
        await query(sql);
        console.log("Schema applied successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
