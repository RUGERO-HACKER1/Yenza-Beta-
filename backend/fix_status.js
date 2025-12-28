import { query } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        console.log("Approving all pending opportunities...");
        const res = await query("UPDATE opportunities SET status = 'approved' WHERE status = 'pending'");
        console.log(`✅ Approved ${res.rowCount} opportunities.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
