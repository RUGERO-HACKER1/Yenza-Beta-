import Parser from 'rss-parser';
import axios from 'axios';
import cron from 'node-cron';
import TurndownService from 'turndown';
import { query } from '../db.js';

const parser = new Parser();
const turndownService = new TurndownService();

// Sources Configuration
const SOURCES = [
    // --- GLOBAL PIPELINES ---
    {
        name: 'WeWorkRemotely: Programming',
        type: 'rss',
        url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
        defaultType: 'job'
    },
    {
        name: 'Remotive: Software Dev',
        type: 'api',
        url: 'https://remotive.com/api/remote-jobs?category=software-dev&limit=30',
        defaultType: 'job',
        format: 'remotive'
    },
    {
        name: 'Jobicy: Remote Jobs',
        type: 'rss',
        url: 'https://jobicy.com/feed/job_feed',
        defaultType: 'job'
    },
    {
        name: 'RemoteOK',
        type: 'api',
        url: 'https://remoteok.com/api',
        defaultType: 'job',
        format: 'remoteok'
    },

    // --- RWANDA / AFRICA PIPELINE ---
    // UN / NGO Jobs -> ReliefWeb API is the gold standard for this.
    {
        name: 'ReliefWeb: Rwanda',
        type: 'api',
        url: 'https://api.reliefweb.int/v1/jobs?appname=yenza&preset=latest&limit=20&query[value]=country:Rwanda&fields[include][]=title&fields[include][]=body&fields[include][]=source&fields[include][]=url',
        defaultType: 'job',
        format: 'reliefweb'
    },

    // GIGS / FREELANCE
    {
        name: 'WeWorkRemotely: Contract',
        type: 'rss',
        url: 'https://weworkremotely.com/categories/remote-contract-jobs.rss',
        defaultType: 'gig'
    },
    {
        name: 'Upwork: Software Dev',
        type: 'rss',
        url: 'https://www.upwork.com/ab/feed/jobs/rss?q=software%20development&sort=recency&paging=0;10&api_params=1',
        defaultType: 'gig'
    },
    {
        name: 'Upwork: Rwanda',
        type: 'rss',
        url: 'https://www.upwork.com/ab/feed/jobs/rss?q=Rwanda&sort=recency&paging=0;10&api_params=1',
        defaultType: 'gig'
    },

    // LEARNING
    {
        name: 'FreeCodeCamp News',
        type: 'rss',
        url: 'https://www.freecodecamp.org/news/rss/',
        defaultType: 'learning'
    },

    // --- INTERNSHIP PIPELINE ---
    {
        name: 'Google Careers: Internships',
        type: 'rss',
        url: 'https://www.google.com/about/careers/applications/jobs/feed.xml',
        defaultType: 'internship'
    },
    {
        name: 'ReliefWeb: Internships (Global)',
        type: 'api',
        url: 'https://api.reliefweb.int/v1/jobs?appname=yenza&preset=latest&limit=10&query[value]=job_type:Internship&fields[include][]=title&fields[include][]=body&fields[include][]=source&fields[include][]=url',
        defaultType: 'internship',
        format: 'reliefweb'
    },

    // --- PIPELINE 4: EVENTS ---
    {
        name: 'Google News: Hackathons',
        type: 'rss',
        url: 'https://news.google.com/rss/search?q=Hackathon+when:7d&hl=en-US&gl=US&ceid=US:en',
        defaultType: 'event'
    },
    {
        name: 'Google News: Tech Events Rwanda',
        type: 'rss',
        url: 'https://news.google.com/rss/search?q=tech+event+rwanda+when:30d&hl=en-US&gl=US&ceid=US:en',
        defaultType: 'event'
    },

    // --- PIPELINE 5: LEARNING (Scholarships & Courses) ---
    {
        name: 'Scholarship Positions',
        type: 'rss',
        url: 'https://www.scholarshippositions.com/feed/',
        defaultType: 'learning'
    }
];

// Helper: Check if job exists
const jobExists = async (externalUrl) => {
    const res = await query('SELECT id FROM opportunities WHERE "externalApplyUrl" = $1', [externalUrl]);
    return res.rows.length > 0;
};

// Helper: Detect Type
const detectType = (title, description, defaultType) => {
    const text = (title + " " + description).toLowerCase();

    if (text.includes('intern') || text.includes('internship') || text.includes('student') || text.includes('summer') || text.includes('trainee')) return 'internship';
    if (text.includes('hackathon') || text.includes('conference') || text.includes('webinar') || text.includes('meetup')) return 'event';
    if (text.includes('part-time') || text.includes('part time')) return 'part-time';
    if (text.includes('freelance') || text.includes('contract')) return 'gig';
    if (text.includes('tutorial') || text.includes('course') || text.includes('guide')) return 'learning';

    return defaultType || 'job';
};

// Helper: Save Job
const saveJob = async (job, defaultType) => {
    try {
        const { title, company, location, description, applyUrl, source } = job;

        // Skip invalid
        if (!title || !applyUrl) return;

        // Clean description
        let cleanDesc = description || '';
        try {
            cleanDesc = turndownService.turndown(description || '');
        } catch (e) {
            cleanDesc = description; // Fallback
        }

        const finalType = detectType(title, cleanDesc, defaultType);

        await query(
            `INSERT INTO opportunities 
            (title, type, company, "companyId", location, description, "externalApplyUrl", "applicationMethod", status, details)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                title,
                finalType,
                company || source,
                'aggregator',
                location || 'Remote',
                cleanDesc,
                applyUrl,
                'external',
                'approved',
                JSON.stringify({ source, originalType: defaultType })
            ]
        );
        console.log(`[Aggregator] Saved [${finalType}]: ${title.substring(0, 30)}...`);
        return true;
    } catch (err) {
        console.error(`[Aggregator] DB Error for ${job.title}:`, err.message);
        return false;
    }
};

// Fetchers
const fetchRSS = async (source) => {
    try {
        const feed = await parser.parseURL(source.url);
        console.log(`[Aggregator] Fetched ${feed.items.length} items from ${source.name}`);

        for (const item of feed.items) {
            const exists = await jobExists(item.link);
            if (!exists) {
                await saveJob({
                    title: item.title,
                    company: "Aggregated: " + source.name,
                    location: 'Remote',
                    description: item.content || item.contentSnippet,
                    applyUrl: item.link,
                    source: source.name
                }, source.defaultType);
            }
        }
    } catch (err) {
        console.error(`[Aggregator] RSS Error (${source.name}):`, err.message);
    }
};

const fetchAPI = async (source) => {
    try {
        const res = await axios.get(source.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        let jobs = [];

        // Handle different API formats
        if (source.format === 'remotive') jobs = res.data.jobs;
        else if (source.format === 'remoteok') jobs = res.data.slice(1); // First item is legal info
        else if (source.format === 'reliefweb') jobs = res.data.data; // ReliefWeb format

        console.log(`[Aggregator] Fetched ${jobs.length} items from ${source.name}`);

        for (const item of jobs) {
            let jobData = {};
            let url = '';

            if (source.format === 'remotive') {
                url = item.url;
                jobData = {
                    title: item.title,
                    company: item.company_name,
                    location: item.candidate_required_location || 'Remote',
                    description: item.description,
                    applyUrl: url,
                    source: source.name
                };
            } else if (source.format === 'remoteok') {
                url = item.url; // Required legal attribution link
                jobData = {
                    title: item.position,
                    company: item.company,
                    location: item.location,
                    description: item.description,
                    applyUrl: url,
                    source: source.name
                };
            } else if (source.format === 'reliefweb') {
                // ReliefWeb items are weird, need detail fetch? No, they provide 'fields'.
                // If not, we use the link. ReliefWeb search list is sparse. 
                // Let's assume title + generic desc for now or use the href.
                url = item.fields?.url || item.href;
                // ReliefWeb API needs 'fields' param to get details. 
                // My URL `query[value]=...` might need `&fields[include][]=title&fields[include][]=body&fields[include][]=source`
                // Improving URL:
                jobData = {
                    title: item.fields?.title || "Relief Job",
                    company: item.fields?.source?.[0]?.name || "UN / NGO",
                    location: "Rwanda",
                    description: item.fields?.body || "View details on official site.",
                    applyUrl: url,
                    source: source.name
                };
            }

            const exists = await jobExists(url);
            if (!exists && url) {
                await saveJob(jobData, source.defaultType);
            }
        }
    } catch (err) {
        console.error(`[Aggregator] API Error (${source.name}):`, err.message);
    }
};

// Main Run Function
export const runAggregator = async () => {
    console.log('🤖 [Job Aggregator] Starting PIPELINE 1 Update...');

    for (const source of SOURCES) {
        if (source.type === 'rss') await fetchRSS(source);
        if (source.type === 'api') await fetchAPI(source);
    }

    console.log('🤖 [Job Aggregator] Cycle complete.');
};

export const startScheduler = () => {
    cron.schedule('0 */6 * * *', () => { runAggregator(); });
    console.log('🕒 [Job Aggregator] Scheduler started.');
};
