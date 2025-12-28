import pkg from 'pg';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);

export const initDB = async () => {
    try {
        console.log("Initializing Database...");
        const client = await pool.connect();

        try {
            // 1. Users Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(255),
                    role VARCHAR(50) DEFAULT 'user',
                    "isVerified" BOOLEAN DEFAULT false,
                    "isProfileComplete" BOOLEAN DEFAULT false,
                    profile JSONB DEFAULT '{}',
                    bookmarks JSONB DEFAULT '[]',
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 2. Companies Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS companies (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    password VARCHAR(255),
                    role VARCHAR(50) DEFAULT 'company',
                    description TEXT,
                    logo TEXT,
                    website VARCHAR(255),
                    "isVerified" BOOLEAN DEFAULT false,
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 3. Opportunities Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS opportunities (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    company VARCHAR(255),
                    "companyId" VARCHAR(255),
                    location VARCHAR(255),
                    description TEXT,
                    deadline TIMESTAMP,
                    "salaryRange" VARCHAR(255),
                    "isFeatured" BOOLEAN DEFAULT false,
                    status VARCHAR(50) DEFAULT 'active',
                    "applicationMethod" VARCHAR(50) DEFAULT 'platform',
                    "externalApplyUrl" TEXT,
                    details JSONB DEFAULT '{}',
                    "userId" INTEGER,
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 4. Applications Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS applications (
                    id SERIAL PRIMARY KEY,
                    "opportunityId" INTEGER NOT NULL,
                    "userId" VARCHAR(255),
                    details JSONB DEFAULT '{}',
                    status VARCHAR(50) DEFAULT 'applied',
                    "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 5. Notifications
            await client.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    "userId" VARCHAR(255) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT,
                    "read" BOOLEAN DEFAULT false,
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 6. Messages (Contact Form)
            await client.query(`
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

            // 7. Page Views (Analytics)
            await client.query(`
                CREATE TABLE IF NOT EXISTS page_views (
                    id SERIAL PRIMARY KEY,
                    path VARCHAR(255) NOT NULL,
                    "userId" VARCHAR(255),
                    "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            console.log("✅ Database Tables Verified/Created Successfully.");
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("❌ Database Initialization Failed:", err);
    }
};
