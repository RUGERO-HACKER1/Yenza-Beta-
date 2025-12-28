import Parser from 'rss-parser';
import axios from 'axios';
import cron from 'node-cron';
import TurndownService from 'turndown';
import { query } from '../db.js';

const parser = new Parser();
const turndownService = new TurndownService();

// Sources Configuration
const SOURCES = [
    {
        name: 'WeWorkRemotely',
        type: 'rss',
        url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss'
    },
    {
        name: 'Remotive',
        type: 'api',
        url: 'https://remotive.com/api/remote-jobs?category=software-dev&limit=20' // Limit to most recent
    }
];

// Helper: Check if job exists
const jobExists = async (externalUrl) => {
    const res = await query('SELECT id FROM opportunities WHERE "externalApplyUrl" = $1', [externalUrl]);
    return res.rows.length > 0;
};

// Helper: Save Job
const saveJob = async (job) => {
    try {
        const { title, company, location, description, applyUrl, source } = job;

        // Clean description (convert HTML to Markdown/Text)
        const cleanDesc = turndownService.turndown(description || '');

        await query(
            `INSERT INTO opportunities 
            (title, type, company, "companyId", location, description, "externalApplyUrl", "applicationMethod", status, details)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                title,
                'Remote', // Default type
                company,
                'aggregator', // Special ID
                location || 'Remote',
                cleanDesc,
                applyUrl,
                'external',
                'approved',
                JSON.stringify({ source })
            ]
        );
        console.log(`[Aggregator] Saved: ${title} at ${company}`);
        return true;
    } catch (err) {
        console.error(`[Aggregator] Error saving job ${job.title}:`, err.message);
        return false;
    }
};

// Fetchers
const fetchRSS = async (source) => {
    try {
        const feed = await parser.parseURL(source.url);
        console.log(`[Aggregator] Fetched ${feed.items.length} items from ${source.name}`);

        for (const item of feed.items) {
            // WeWorkRemotely specific fields (or generic RSS)
            const exists = await jobExists(item.link);
            if (!exists) {
                await saveJob({
                    title: item.title,
                    company: "WeWorkRemotely Host", // RSS often hides company in title "Company: Title"
                    location: 'Remote',
                    description: item.content || item.contentSnippet,
                    applyUrl: item.link,
                    source: source.name
                });
            }
        }
    } catch (err) {
        console.error(`[Aggregator] RSS Error (${source.name}):`, err.message);
    }
};

const fetchAPI = async (source) => {
    try {
        const res = await axios.get(source.url);
        const jobs = res.data.jobs || []; // Remotive structure
        console.log(`[Aggregator] Fetched ${jobs.length} items from ${source.name}`);

        for (const item of jobs) {
            const exists = await jobExists(item.url);
            if (!exists) {
                await saveJob({
                    title: item.title,
                    company: item.company_name,
                    location: item.candidate_required_location || 'Remote',
                    description: item.description,
                    applyUrl: item.url,
                    source: source.name
                });
            }
        }
    } catch (err) {
        console.error(`[Aggregator] API Error (${source.name}):`, err.message);
    }
};

// Main Run Function
export const runAggregator = async () => {
    console.log('🤖 [Job Aggregator] Starting update cycle...');

    for (const source of SOURCES) {
        if (source.type === 'rss') await fetchRSS(source);
        if (source.type === 'api') await fetchAPI(source);
    }

    console.log('🤖 [Job Aggregator] Cycle complete.');
};

// Scheduler (Exported to start in server.js)
export const startScheduler = () => {
    // Run every 6 hours
    cron.schedule('0 */6 * * *', () => {
        runAggregator();
    });
    console.log('🕒 [Job Aggregator] Scheduler started (Every 6 hours).');
};
