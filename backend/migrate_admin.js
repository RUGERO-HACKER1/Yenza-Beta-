import { query } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        console.log("Migrating Companies table...");
        await query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE');
        await query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
        await query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'company\'');

        console.log("Seeding Admin...");
        // Check if admin exists
        const res = await query("SELECT * FROM companies WHERE email = 'admin@yenza.com'");
        if (res.rows.length === 0) {
            await query(
                "INSERT INTO companies (name, email, password, role, \"isVerified\", description) VALUES ($1, $2, $3, $4, $5, $6)",
                ['Admin', 'admin@yenza.com', 'admin123', 'admin', true, 'System Admin']
            );
            console.log("✅ Admin created: admin@yenza.com / admin123");
        } else {
            console.log("Admin already exists.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
