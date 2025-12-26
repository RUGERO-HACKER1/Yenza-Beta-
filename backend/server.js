import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads dir
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// Generic Upload Endpoint
app.post('/upload', (req, res) => {
    const { fileBase64 } = req.body;
    if (!fileBase64) return res.status(400).json({ message: 'No file provided' });

    try {
        const matches = fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ message: 'Invalid base64 string' });
        }

        const extension = matches[1].split('/')[1] || 'bin';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `upload_${Date.now()}.${extension}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        fs.writeFileSync(filePath, buffer);
        res.json({ url: `http://localhost:5000/uploads/${filename}` });
    } catch (err) {
        console.error("Upload error", err);
        res.status(500).json({ message: 'Upload failed' });
    }
});

// Helper to read DB
const readDb = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { opportunities: [] };
    }
};

// Helper to write DB
const writeDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// GET Public Opportunities (Approved only)
app.get('/opportunities', (req, res) => {
    const db = readDb();
    const approved = db.opportunities.filter(op => op.status === 'approved');
    res.json(approved);
});

// GET All Opportunities (Admin)
app.get('/admin/opportunities', (req, res) => {
    const db = readDb();
    res.json(db.opportunities);
});

// GET Single Opportunity
app.get('/opportunities/:id', (req, res) => {
    const db = readDb();
    const op = db.opportunities.find(o => o.id === req.params.id);
    if (op) res.json(op);
    else res.status(404).json({ message: 'Not found' });
});

// POST New Opportunity
app.post('/opportunities', (req, res) => {
    const db = readDb();

    // Allow custom overrides (for Admin posting)
    // If request comes from Admin, they can set status='approved' immediately and specify company name
    const { company, companyId, status } = req.body;

    const newOp = {
        id: Date.now().toString(),
        ...req.body,
        // Fallbacks if not provided (regular company posting)
        createdAt: new Date().toISOString(),
        status: status || 'pending',
        companyId: companyId || 'admin-posted', // Fallback for admin custom posts
        company: company || 'Hidden'
    };
    db.opportunities.push(newOp);
    writeDb(db);
    res.status(201).json(newOp);
});

// DELETE Opportunity (Admin)
app.delete('/admin/opportunities/:id', (req, res) => {
    const db = readDb();
    const initialLength = db.opportunities.length;
    db.opportunities = db.opportunities.filter(o => o.id !== req.params.id);

    if (db.opportunities.length < initialLength) {
        writeDb(db);
        res.json({ message: 'Opportunity deleted' });
    } else {
        res.status(404).json({ message: 'Opportunity not found' });
    }
});

// GET All Companies
app.get('/companies', (req, res) => {
    const db = readDb();
    res.json(db.companies || []);
});

// GET Single Company
app.get('/companies/:id', (req, res) => {
    const db = readDb();
    const company = (db.companies || []).find(c => c.id === req.params.id);
    if (company) res.json(company);
    else res.status(404).json({ message: 'Company not found' });
});

// GET Messages (Admin)
app.get('/admin/messages', (req, res) => {
    const db = readDb();
    res.json(db.messages || []);
});

// POST New Message (Contact Form)
app.post('/messages', (req, res) => {
    const db = readDb();
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    const newMessage = {
        id: `msg_${Date.now()}`,
        name,
        email,
        subject: subject || 'No Subject',
        message,
        read: false,
        createdAt: new Date().toISOString()
    };

    if (!db.messages) db.messages = [];
    db.messages.push(newMessage);
    writeDb(db);
    res.status(201).json(newMessage);
});

// GET Public Stats (Phase 19)
app.get('/stats', (req, res) => {
    const db = readDb();
    const stats = {
        users: (db.users || []).length,
        companies: (db.companies || []).length,
        opportunities: (db.opportunities || []).filter(o => o.status === 'approved').length,
        applications: (db.applications || []).length
    };
    res.json(stats);
});

// PATCH Update Company Status (Admin)
app.patch('/admin/companies/:id', (req, res) => {
    const db = readDb();
    const index = (db.companies || []).findIndex(c => c.id === req.params.id);
    if (index !== -1) {
        const { check, rejectionReason } = req.body;

        let updates = { ...req.body };

        // Auto-update isVerified based on check
        if (check === 'approved') {
            updates.isVerified = true;
            updates.rejectionReason = undefined; // Clear previous rejection
        } else if (check === 'rejected') {
            updates.isVerified = false;
        }

        db.companies[index] = { ...db.companies[index], ...updates };
        writeDb(db);
        const { password: _, ...companyWithoutPass } = db.companies[index];
        res.json(companyWithoutPass);
    } else {
        res.status(404).json({ message: 'Company not found' });
    }
});

// PATCH Update Status (Admin)
app.patch('/admin/opportunities/:id', (req, res) => {
    const db = readDb();
    const index = db.opportunities.findIndex(o => o.id === req.params.id);
    if (index !== -1) {
        db.opportunities[index] = { ...db.opportunities[index], ...req.body };
        writeDb(db);
        res.json(db.opportunities[index]);
    } else {
        res.status(404).json({ message: 'Not found' });
    }
});

// AUTHENTICATION
// POST Signup
app.post('/auth/signup', (req, res) => {
    const db = readDb();
    const { name, email, password, phone, website, address, documentBase64 } = req.body;

    // Validation
    if (!name || !email || !password || !phone || !website || !address || !documentBase64) {
        return res.status(400).json({ message: 'All fields and document required' });
    }

    // Check existing
    const existing = (db.companies || []).find(c => c.email === email);
    if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
    }

    // Handle File Upload (Base64 -> File)
    let documentUrl = '';
    try {
        const matches = documentBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const extension = matches[1].split('/')[1] || 'bin'; // e.g., pdf, jpeg
            const buffer = Buffer.from(matches[2], 'base64');
            const filename = `doc_${Date.now()}.${extension}`;
            const filePath = path.join(UPLOADS_DIR, filename);
            fs.writeFileSync(filePath, buffer);
            documentUrl = `/uploads/${filename}`;
        }
    } catch (err) {
        console.error("File save error", err);
        return res.status(500).json({ message: 'Error uploading document' });
    }

    const newCompany = {
        id: Date.now().toString(),
        name,
        email,
        password, // In production, HASH this!
        phone,
        website,
        address,
        documentUrl, // Saved path
        description: '',
        logo: '',
        check: 'pending',
        isVerified: false,
        createdAt: new Date().toISOString()
    };

    if (!db.companies) db.companies = [];
    db.companies.push(newCompany);
    writeDb(db);

    // Return without password
    const { password: _, ...companyWithoutPass } = newCompany;
    res.status(201).json(companyWithoutPass);
});

// GET All Applications (Admin)
app.get('/admin/applications', (req, res) => {
    const db = readDb();
    res.json(db.applications || []);
});

// PATCH Application Status (Admin)
app.patch('/admin/applications/:id', (req, res) => {
    const db = readDb();
    const index = (db.applications || []).findIndex(a => a.id === req.params.id);
    if (index !== -1) {
        db.applications[index] = { ...db.applications[index], ...req.body };
        // Create Notification
        const app = db.applications[index];
        const op = db.opportunities.find(o => o.id === app.opportunityId);
        const notif = {
            id: Date.now().toString(),
            userId: app.userId,
            message: `Your application for ${op ? op.title : 'an opportunity'} has been ${req.body.status.toUpperCase()}.`,
            type: req.body.status === 'shortlisted' ? 'success' : 'warning',
            relatedId: app.id,
            read: false,
            createdAt: new Date().toISOString()
        };
        if (!db.notifications) db.notifications = [];
        db.notifications.push(notif);

        writeDb(db);
        res.json(db.applications[index]);
    } else {
        res.status(404).json({ message: 'Application not found' });
    }
});

// POST Login
app.post('/auth/login', (req, res) => {
    const db = readDb();
    const { email, password } = req.body;

    const company = (db.companies || []).find(c => c.email === email && c.password === password);

    // ALSO CHECK USERS (For Admin or Regular Users Login via same endpoint if desired, but we have separate user login below)
    // Actually, usually admin logs in here. Let's check users too if company not found.
    if (!company) {
        const user = (db.users || []).find(u => u.email === email && u.password === password);
        if (user) {
            const { password: _, ...userWithoutPass } = user;
            return res.json(userWithoutPass);
        }
    }

    if (company) {
        if (company.check !== 'approved') {
            return res.status(403).json({
                message: company.check === 'rejected'
                    ? 'Your account has been rejected.'
                    : 'Account pending admin approval.'
            });
        }
        const { password: _, ...companyWithoutPass } = company;
        res.json(companyWithoutPass);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// USER AUTH
app.post('/auth/user/signup', (req, res) => {
    const db = readDb();
    const { email, password } = req.body; // Remove name from requirement

    if (!email || !password) return res.status(400).json({ message: 'Email and Password required' });

    const existing = (db.users || []).find(u => u.email === email);
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const newUser = {
        id: Date.now().toString(),
        name: '', // Placeholder, will be filled in onboarding
        email,
        password,
        role: 'user',
        isProfileComplete: false, // New flag
        bookmarks: [],
        applications: []
    };

    if (!db.users) db.users = [];
    db.users.push(newUser);
    writeDb(db);

    const { password: _, ...userWithoutPass } = newUser;
    res.status(201).json(userWithoutPass);
});

app.post('/auth/user/login', (req, res) => {
    const db = readDb();
    const { email, password } = req.body;

    const user = (db.users || []).find(u => u.email === email && u.password === password);

    if (user) {
        const { password: _, ...userWithoutPass } = user;
        res.json(userWithoutPass);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// GET User Profile (Fetch fresh bookmarks etc)
app.get('/users/:id', (req, res) => {
    const db = readDb();
    const user = (db.users || []).find(u => u.id === req.params.id);
    if (user) {
        const { password: _, ...userWithoutPass } = user;
        res.json(userWithoutPass);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// GET All Users (Admin)
app.get('/users', (req, res) => {
    const db = readDb();
    const users = (db.users || []).map(u => {
        const { password, ...rest } = u;
        return rest;
    });
    res.json(users);
});

// PATCH User (Update Bookmarks/Profile)
app.patch('/users/:id', (req, res) => {
    const db = readDb();
    const index = (db.users || []).findIndex(u => u.id === req.params.id);
    if (index !== -1) {
        // Prevent password update via this route for simplicity
        const { password, ...updates } = req.body;
        db.users[index] = { ...db.users[index], ...updates };
        writeDb(db);
        const { password: _, ...userWithoutPass } = db.users[index];
        res.json(userWithoutPass);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// APPLICATIONS
// POST Submit Application
app.post('/applications', (req, res) => {
    const db = readDb();
    const { userId, opportunityId, ...data } = req.body;

    if (!userId || !opportunityId) return res.status(400).json({ message: 'Missing fields' });

    // Check if already applied
    const existing = (db.applications || []).find(a => a.userId === userId && a.opportunityId === opportunityId);
    if (existing) return res.status(400).json({ message: 'Already applied' });

    const newApp = {
        id: Date.now().toString(),
        userId,
        opportunityId,
        ...data,
        status: 'applied', // applied, shortlisted, rejected
        submittedAt: new Date().toISOString()
    };

    if (!db.applications) db.applications = [];
    db.applications.push(newApp);

    // Also update user's applications list if you want redundancy, but fetching by userId is better
    writeDb(db);
    res.status(201).json(newApp);
});

// GET Applications (Filter by user or opportunity)
app.get('/applications', (req, res) => {
    const db = readDb();
    let apps = db.applications || [];

    if (req.query.userId) {
        apps = apps.filter(a => a.userId === req.query.userId);
    }
    if (req.query.opportunityId) {
        apps = apps.filter(a => a.opportunityId === req.query.opportunityId);
    }
    // For Companies: Fetch applications for a list of opportunity IDs? 
    // Or just fetch all and filter in frontend for MVP. 
    // Let's allow fetching all if no params (admin/debugging) or specific filtering.

    res.json(apps);
});

// PATCH Update Application Status
app.patch('/applications/:id', (req, res) => {
    const db = readDb();
    const index = (db.applications || []).findIndex(a => a.id === req.params.id);
    if (index !== -1) {
        const { status } = req.body;
        if (status) db.applications[index].status = status;
        writeDb(db);
        res.json(db.applications[index]);
    } else {
        res.status(404).json({ message: 'Application not found' });
    }
});

// NOTIFICATIONS
// POST Create Notification
app.post('/notifications', (req, res) => {
    const db = readDb();
    const { userId, message, type, relatedId } = req.body; // type: 'info', 'success', 'warning'

    if (!userId || !message) return res.status(400).json({ message: 'Missing fields' });

    const newNotif = {
        id: Date.now().toString(),
        userId,
        message,
        type: type || 'info',
        relatedId,
        read: false,
        createdAt: new Date().toISOString()
    };

    if (!db.notifications) db.notifications = [];
    db.notifications.push(newNotif);
    writeDb(db);
    res.status(201).json(newNotif);
});

// GET Notifications (by userId)
app.get('/notifications', (req, res) => {
    const db = readDb();
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });

    const userNotifs = (db.notifications || [])
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first

    res.json(userNotifs);
});

// PATCH Mark Notification as Read
app.patch('/notifications/:id', (req, res) => {
    const db = readDb();
    const index = (db.notifications || []).findIndex(n => n.id === req.params.id);
    if (index !== -1) {
        db.notifications[index].read = true;
        writeDb(db);
        res.json(db.notifications[index]);
    } else {
        res.status(404).json({ message: 'Notification not found' });
    }
});

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error(err);
        }
    });
};

startServer(PORT);
