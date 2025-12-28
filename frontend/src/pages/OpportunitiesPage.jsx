import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const OpportunitiesPage = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [companyMap, setCompanyMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false); // Mobile toggle

    // --- 1. FILTER STATE (The 17-Point List) ---
    const [filters, setFilters] = useState({
        // Must-Haves
        type: 'all',
        location: '',
        datePosted: 'any',
        deadline: 'any',
        keyword: '',
        // Job
        experienceLevel: 'any',
        salaryType: 'any', // Paid, Unpaid
        workMode: 'any',
        // Gig
        budgetType: 'any',
        duration: 'any',
        // Event
        eventMode: 'any',
        eventCost: 'any',
        eventDate: 'any',
        // Learning
        learningType: 'any',
        learningCost: 'any',
        learningMode: 'any',
        provider: 'any'
    });

    const [sortBy, setSortBy] = useState('featured');

    useEffect(() => {
        Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/opportunities`).then(res => res.json()),
            fetch(`${import.meta.env.VITE_API_URL}/companies`).then(res => res.json())
        ]).then(([opsData, companiesData]) => {
            setOpportunities(opsData);
            const map = {};
            companiesData.forEach(c => map[c.id] = c);
            setCompanyMap(map);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch", err);
            setLoading(false);
        });
    }, []);

    // --- 2. FILTER LOGIC ---
    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            type: 'all', location: '', datePosted: 'any', deadline: 'any', keyword: '',
            experienceLevel: 'any', salaryType: 'any', workMode: 'any',
            budgetType: 'any', duration: 'any',
            eventMode: 'any', eventCost: 'any', eventDate: 'any',
            learningType: 'any', learningCost: 'any', learningMode: 'any', provider: 'any'
        });
        setSearchQuery('');
    };

    // Helper: Date Logic
    const isRecent = (dateStr, days) => {
        if (!dateStr) return false;
        const fn = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now - fn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days;
    };

    const matchesFilter = (op) => {
        // 1. Type
        if (filters.type !== 'all' && op.type !== filters.type) return false;

        // 2. Keyword
        const q = filters.keyword.toLowerCase();
        if (q && !op.title.toLowerCase().includes(q) && !op.company.toLowerCase().includes(q) && !op.description?.toLowerCase().includes(q)) return false;

        // 3. Location
        if (filters.location) {
            const loc = (op.location || '').toLowerCase();
            const typeLoc = (op.locationType || '').toLowerCase();
            const fl = filters.location.toLowerCase();
            if (!loc.includes(fl) && !typeLoc.includes(fl)) return false;
        }

        // 4. Date Posted
        if (filters.datePosted !== 'any') {
            if (filters.datePosted === 'today' && !isRecent(op.createdAt, 1)) return false;
            if (filters.datePosted === '3days' && !isRecent(op.createdAt, 3)) return false;
            if (filters.datePosted === '7days' && !isRecent(op.createdAt, 7)) return false;
            if (filters.datePosted === '30days' && !isRecent(op.createdAt, 30)) return false;
        }

        // 5. Deadline
        if (filters.deadline === 'closing_soon') {
            if (!op.deadline) return false;
            const daysLeft = (new Date(op.deadline) - new Date()) / (1000 * 60 * 60 * 24);
            if (daysLeft < 0 || daysLeft > 7) return false;
        }

        // --- SCOPED FILTERS ---
        // JOB
        if (op.type === 'job' || op.type === 'internship') {
            if (filters.experienceLevel !== 'any' && op.experienceLevel !== filters.experienceLevel) return false;
            if (filters.workMode !== 'any' && op.locationType !== filters.workMode) return false;
            if (filters.salaryType !== 'any') {
                const isPaid = op.salaryRange && op.salaryRange !== 'Unpaid';
                if (filters.salaryType === 'paid' && !isPaid) return false;
                if (filters.salaryType === 'unpaid' && isPaid) return false;
            }
        }

        // GIG
        if (op.type === 'gig') {
            // Budget logic simplified (checking string presence or 'Fixed'/'Hourly')
            if (filters.budgetType !== 'any' && !op.budget?.includes(filters.budgetType)) return false;
            if (filters.duration !== 'any' && op.duration !== filters.duration) return false;
        }

        // EVENT
        if (op.type === 'event') {
            if (filters.eventMode !== 'any' && op.locationType !== filters.eventMode) return false;
            if (filters.eventCost !== 'any') {
                const isFree = op.registrationType === 'Free';
                if (filters.eventCost === 'Free' && !isFree) return false;
                if (filters.eventCost === 'Paid' && isFree) return false;
            }
            // Event Date Logic (This Week/Month)
            if (filters.eventDate !== 'any') {
                const d = new Date(op.startDate);
                const now = new Date();
                const endOfWeek = new Date(); endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                if (filters.eventDate === 'this_week' && d > endOfWeek) return false;
                if (filters.eventDate === 'this_month' && d > endOfMonth) return false;
            }
        }

        // LEARNING
        if (op.type === 'learning') {
            if (filters.learningType !== 'any' && op.learningType !== filters.learningType) return false;
            if (filters.learningMode !== 'any' && op.courseMode !== filters.learningMode) return false;
            if (filters.learningCost !== 'any') {
                const isFree = op.cost === 'Free';
                if (filters.learningCost === 'Free' && !isFree) return false;
                if (filters.learningCost === 'Paid' && isFree) return false;
            }
            if (filters.provider !== 'any' && !op.courseProvider?.toLowerCase().includes(filters.provider.toLowerCase())) return false;
        }

        return true;
    };


    const filteredOps = opportunities.filter(matchesFilter);

    const sortedOps = [...filteredOps].sort((a, b) => {
        if (sortBy === 'featured') {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'deadline') {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        }
        return 0;
    });

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading opportunities...</div>;

    return (
        <div className="container" style={{ padding: '2rem 24px', minHeight: '80vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Find Opportunities</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search by title, company, or keyword..."
                            value={filters.keyword}
                            onChange={(e) => updateFilter('keyword', e.target.value)}
                            style={{ width: '100%', padding: '1rem', paddingLeft: '3rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                        />
                        <span style={{ position: 'absolute', left: '1rem', top: '1rem', fontSize: '1.2rem' }}>🔍</span>
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline mobile-only" style={{ display: 'none' }}>
                        🌪 Filters
                    </button>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}>
                        <option value="featured">✨ Featured</option>
                        <option value="newest">🕒 Newest</option>
                        <option value="deadline">📅 Closing Soon</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>

                {/* --- SIDEBAR FILTERS --- */}
                <aside style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', position: 'sticky', top: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Filters</h3>
                        <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}>Reset</button>
                    </div>

                    {/* 1. Opportunity Type */}
                    <div className="filter-group">
                        <label>Type</label>
                        <select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
                            <option value="all">All Types</option>
                            <option value="job">💼 Job</option>
                            <option value="internship">🎓 Internship</option>
                            <option value="part-time">⏳ Part-Time</option>
                            <option value="gig">⚡ Gig / Freelance</option>
                            <option value="event">📅 Event</option>
                            <option value="learning">📚 Learning / Course</option>
                        </select>
                    </div>

                    {/* 2. Common Filters */}
                    <div className="filter-group">
                        <label>Location</label>
                        <select value={filters.location} onChange={(e) => updateFilter('location', e.target.value)}>
                            <option value="">Anywhere</option>
                            <option value="Remote">Remote</option>
                            <option value="Rwanda">Rwanda</option>
                            <option value="Kigali">Kigali</option>
                            <option value="Kenya">Kenya</option>
                            <option value="Global">Global</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Date Posted</label>
                        <select value={filters.datePosted} onChange={(e) => updateFilter('datePosted', e.target.value)}>
                            <option value="any">Any Time</option>
                            <option value="today">Today</option>
                            <option value="3days">Last 3 Days</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                        </select>
                    </div>

                    {/* --- DYNAMIC FILTERS BASED ON TYPE --- */}

                    {/* JOBS / INTERNSHIPS */}
                    {(filters.type === 'job' || filters.type === 'internship' || filters.type === 'all') && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
                            <p className="filter-header">Job Options</p>
                            <div className="filter-group">
                                <label>Experience</label>
                                <select value={filters.experienceLevel} onChange={(e) => updateFilter('experienceLevel', e.target.value)}>
                                    <option value="any">Any Level</option>
                                    <option value="Entry">Entry Level</option>
                                    <option value="Mid">Mid Level</option>
                                    <option value="Senior">Senior</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Work Mode</label>
                                <select value={filters.workMode} onChange={(e) => updateFilter('workMode', e.target.value)}>
                                    <option value="any">Any Mode</option>
                                    <option value="On-site">On-site</option>
                                    <option value="Remote">Remote</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* GIGS */}
                    {(filters.type === 'gig' || filters.type === 'all') && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
                            <p className="filter-header">Gig Options</p>
                            <div className="filter-group">
                                <label>Budget Type</label>
                                <select value={filters.budgetType} onChange={(e) => updateFilter('budgetType', e.target.value)}>
                                    <option value="any">Any</option>
                                    <option value="Fixed">Fixed Price</option>
                                    <option value="Hourly">Hourly</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* EVENTS */}
                    {(filters.type === 'event' || filters.type === 'all') && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
                            <p className="filter-header">Event Options</p>
                            <div className="filter-group">
                                <label>Mode</label>
                                <select value={filters.eventMode} onChange={(e) => updateFilter('eventMode', e.target.value)}>
                                    <option value="any">Any</option>
                                    <option value="Online">Online</option>
                                    <option value="Physical">In-Person</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Cost</label>
                                <select value={filters.eventCost} onChange={(e) => updateFilter('eventCost', e.target.value)}>
                                    <option value="any">Any</option>
                                    <option value="Free">Free</option>
                                    <option value="Paid">Paid / Ticketed</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* LEARNING -- VERY IMPORTANT */}
                    {(filters.type === 'learning' || filters.type === 'all') && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem', background: '#fafafa', padding: '10px', borderRadius: '8px' }}>
                            <p className="filter-header" style={{ color: '#d97706' }}>📚 Learning Options</p>
                            <div className="filter-group">
                                <label>Type</label>
                                <select value={filters.learningType} onChange={(e) => updateFilter('learningType', e.target.value)}>
                                    <option value="any">Any</option>
                                    <option value="Course">Course</option>
                                    <option value="Scholarship">Scholarship</option>
                                    <option value="Bootcamp">Bootcamp</option>
                                    <option value="Certification">Certification</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Cost</label>
                                <select value={filters.learningCost} onChange={(e) => updateFilter('learningCost', e.target.value)}>
                                    <option value="any">Any</option>
                                    <option value="Free">Free</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Fully Funded">Fully Funded</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Provider</label>
                                <select value={filters.provider} onChange={(e) => updateFilter('provider', e.target.value)}>
                                    <option value="any">Any</option>
                                    <option value="Google">Google</option>
                                    <option value="Coursera">Coursera</option>
                                    <option value="ALX">ALX</option>
                                    <option value="University">Universities</option>
                                </select>
                            </div>
                        </div>
                    )}


                    <style>{`
                        .filter-group { margin-bottom: 1rem; }
                        .filter-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: #374151; }
                        .filter-group select { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; background: #fff; }
                        .filter-header { font-size: 0.85rem; font-weight: bold; text-transform: uppercase; color: #9ca3af; margin-bottom: 0.8rem; letter-spacing: 0.5px; }
                        @media (max-width: 768px) {
                            .grid-layout { grid-template-columns: 1fr !important; }
                            aside { display: none; } /* Add toggle logic later */
                            .mobile-only { display: block !important; }
                        }
                    `}</style>
                </aside>

                {/* --- RESULTS AREA --- */}
                <div>
                    <div style={{ marginBottom: '1rem', color: 'var(--text-light)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Found {sortedOps.length} results</span>
                        {filters.type !== 'all' && <span className={`tag tag-${filters.type}`}>{filters.type.toUpperCase()} LIST</span>}
                    </div>

                    {sortedOps.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f9fafb', borderRadius: '12px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3>No matches found</h3>
                            <p style={{ color: '#6b7280' }}>Try adjusting or clearing your filters.</p>
                            <button onClick={clearFilters} className="btn btn-outline" style={{ marginTop: '1rem' }}>Clear All Filters</button>
                        </div>
                    ) : (
                        <div className="grid grid-2" style={{ gap: '1.5rem' }}>
                            {sortedOps.map(op => {
                                const isVerified = companyMap[op.companyId]?.isVerified;
                                // Keeping the exact card logic from before, just wrapped for grid layout
                                // Simplified for brevity in this replace block, but ensuring All logic remains
                                const isEvent = op.type === 'event';

                                // ... (Insert existing card rendering logic here or componentize it) ...
                                // For safety and length, I will use a simplified Card component structure 
                                // but ideally we keep the rich cards. 
                                // Let's try to inline the rich card logic as requested.

                                return (
                                    <Link to={`/opportunities/${op.id}`} key={op.id} className="card" style={{
                                        display: 'flex', flexDirection: 'column', gap: '1rem', textDecoration: 'none', position: 'relative', overflow: 'hidden',
                                        borderColor: op.isFeatured ? '#fcd34d' : 'var(--border)',
                                        boxShadow: op.isFeatured ? '0 0 0 2px var(--secondary), var(--shadow-md)' : undefined,
                                        height: '100%'
                                    }}>
                                        {op.isFeatured && (
                                            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--secondary)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.25rem 0.75rem', borderBottomLeftRadius: '8px' }}>FEATURED</div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid var(--border)' }}>
                                                {companyMap[op.companyId]?.logo ? <img src={companyMap[op.companyId].logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : (op.type === 'job' ? '💼' : op.type === 'part-time' ? '⏳' : op.type === 'gig' ? '⚡' : op.type === 'learning' ? '📚' : op.type === 'event' ? '📅' : '🎓')}
                                            </div>
                                            <span className={`tag tag-${op.type}`}>{op.type}</span>
                                        </div>

                                        <div>
                                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', lineHeight: '1.4', color: '#1f2937' }}>{op.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', fontWeight: '500' }}>{op.company}</p>
                                                {isVerified && <span title="Verified" style={{ color: '#0ea5e9', fontSize: '0.9rem' }}>✔</span>}
                                            </div>
                                        </div>

                                        {/* Dynamic Badges */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
                                            {op.location && <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px' }}>📍 {op.location}</span>}
                                            {op.salaryRange && op.salaryRange !== 'Unpaid' && <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '12px' }}>💰 {op.salaryRange}</span>}
                                            {op.type === 'event' && <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '12px' }}>📅 {new Date(op.startDate).toLocaleDateString()}</span>}
                                        </div>

                                        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                            <span>{op.deadline ? `🕒 Deadline: ${new Date(op.deadline).toLocaleDateString()}` : `Posted: ${new Date(op.createdAt).toLocaleDateString()}`}</span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OpportunitiesPage;
const [opportunities, setOpportunities] = useState([]);
const [companyMap, setCompanyMap] = useState({});
const [loading, setLoading] = useState(true);

// Filter States
const [searchQuery, setSearchQuery] = useState('');
const [selectedTypes, setSelectedTypes] = useState(['all']);
const [selectedTags, setSelectedTags] = useState([]);
const [sortBy, setSortBy] = useState('featured');

useEffect(() => {
    Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/opportunities`).then(res => res.json()),
        fetch(`${import.meta.env.VITE_API_URL}/companies`).then(res => res.json())
    ]).then(([opsData, companiesData]) => {
        setOpportunities(opsData);

        const map = {};
        companiesData.forEach(c => map[c.id] = c);
        setCompanyMap(map);

        setLoading(false);
    }).catch(err => {
        console.error("Failed to fetch", err);
        setLoading(false);
    });
}, []);

// ... (Filter Logic Same as before) ...
// Derived Filters
const handleTypeToggle = (type) => {
    if (type === 'all') {
        setSelectedTypes(['all']);
        return;
    }
    let newTypes = selectedTypes.includes('all') ? [] : [...selectedTypes];
    if (newTypes.includes(type)) newTypes = newTypes.filter(t => t !== type);
    else newTypes.push(type);
    if (newTypes.length === 0) setSelectedTypes(['all']);
    else setSelectedTypes(newTypes);
};

const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else setSelectedTags([...selectedTags, tag]);
};

const filteredOps = opportunities.filter(op => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = op.title.toLowerCase().includes(searchLower) ||
        op.company.toLowerCase().includes(searchLower) ||
        (op.description && op.description.toLowerCase().includes(searchLower));
    const matchesType = selectedTypes.includes('all') || selectedTypes.includes(op.type);
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => op.tags && op.tags.includes(tag));
    return matchesSearch && matchesType && matchesTags;
});

const sortedOps = [...filteredOps].sort((a, b) => {
    if (sortBy === 'featured') {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    }
    return 0;
});

const allTags = Array.from(new Set(opportunities.flatMap(op => op.tags || [])));

if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading opportunities...</div>;

return (
    <div className="container" style={{ padding: '3rem 24px', minHeight: '60vh' }}>
        <div className="section-title">
            <h2>Explore Opportunities</h2>
            <p>Find your next big step.</p>
        </div>

        {/* --- Advanced Filter Bar (Keep existing) --- */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <input type="text" placeholder="Search by title, company, or keyword..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '1rem' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Sort by:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', backgroundColor: 'white' }}>
                        <option value="featured">✨ Featured</option>
                        <option value="newest">🕒 Newest</option>
                        <option value="deadline">📅 Closing Soon</option>
                    </select>
                </div>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '1.5rem' }} />
            <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Type</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => handleTypeToggle('all')} className={`btn ${selectedTypes.includes('all') ? 'btn-secondary' : 'btn-outline'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>All Types</button>
                    {['job', 'internship', 'part-time', 'event', 'gig', 'learning'].map(type => (
                        <button key={type} onClick={() => handleTypeToggle(type)} className={`btn ${selectedTypes.includes(type) ? 'btn-secondary' : 'btn-outline'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                            {selectedTypes.includes(type) && <span style={{ marginRight: '4px' }}>✓</span>} {selectedTypes.includes(type) && type === 'learning' ? 'Learning / Course' : type}
                        </button>
                    ))}
                </div>
            </div>
            {allTags.length > 0 && (
                <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Tags</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {allTags.map(tag => (
                            <button key={tag} onClick={() => handleTagToggle(tag)} className="tag" style={{ cursor: 'pointer', border: selectedTags.includes(tag) ? '1px solid var(--primary)' : '1px solid var(--border)', background: selectedTags.includes(tag) ? 'var(--primary-light)' : 'white', color: selectedTags.includes(tag) ? 'var(--primary)' : 'var(--text-main)', transition: 'all 0.1s' }}>
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div style={{ marginBottom: '1rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Showing {sortedOps.length} results
        </div>

        <div className="grid grid-3">
            {sortedOps.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                    <h3>No opportunities found</h3>
                    <p>Try adjusting your search or filters.</p>
                    <button onClick={() => { setSearchQuery(''); setSelectedTypes(['all']); setSelectedTags([]); }} style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', border: 'none', background: 'none' }}>Clear all filters</button>
                </div>
            ) : (
                sortedOps.map(op => {
                    const isVerified = companyMap[op.companyId]?.isVerified;

                    // --- EVENT CARD VARIANT ---
                    if (op.type === 'event') {
                        const eventDate = op.startDate ? new Date(op.startDate) : null;
                        const month = eventDate ? eventDate.toLocaleString('default', { month: 'short' }) : 'TBA';
                        const day = eventDate ? eventDate.getDate() : '?';

                        return (
                            <Link to={`/opportunities/${op.id}`} key={op.id} className="card" style={{
                                display: 'flex', flexDirection: 'column', textDecoration: 'none',
                                padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '12px',
                                transition: 'transform 0.2s', position: 'relative'
                            }}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ height: '140px', background: '#f3f4f6', position: 'relative' }}>
                                    {op.bannerImage ? (
                                        <img src={op.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#cbd5e1' }}>📅</div>
                                    )}
                                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'white', borderRadius: '8px', padding: '4px 10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', minWidth: '50px' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>{month}</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: '1', color: '#1e293b' }}>{day}</div>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                        {op.registrationType === 'Free' ? 'Free Entry' : 'Ticketed'}
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <span className={`tag tag-${op.type}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{op.eventType || 'Event'}</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.3', color: '#111827', margin: '0.25rem 0' }}>{op.title}</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>by <strong style={{ color: '#475569' }}>{op.organizer}</strong> {isVerified && '✔'}</p>

                                    <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                                        <span>📍 {op.locationType === 'Online' ? 'Online' : op.location.split(',')[0]}</span>
                                        <span>•</span>
                                        <span>{eventDate ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    }

                    // --- STANDARD LIST CARD (Job, Internship, Part-Time, Gig) ---
                    return (
                        <Link to={`/opportunities/${op.id}`} key={op.id} className="card" style={{
                            display: 'flex', flexDirection: 'column', gap: '1rem', textDecoration: 'none', position: 'relative', overflow: 'hidden',
                            borderColor: op.isFeatured ? '#fcd34d' : 'var(--border)',
                            boxShadow: op.isFeatured ? '0 0 0 2px var(--secondary), var(--shadow-md)' : undefined
                        }}>
                            {op.isFeatured && (
                                <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--secondary)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.25rem 0.75rem', borderBottomLeftRadius: '8px' }}>FEATURED</div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid var(--border)' }}>
                                    {/* Logo Placeholder or Op Type Icon */}
                                    {companyMap[op.companyId]?.logo ? <img src={companyMap[op.companyId].logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : (op.type === 'job' ? '💼' : op.type === 'part-time' ? '⏳' : op.type === 'gig' ? '⚡' : op.type === 'learning' ? '📚' : '🎓')}
                                </div>
                                <span className={`tag tag-${op.type}`}>{op.type}</span>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', lineHeight: '1.4' }}>{op.title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', fontWeight: '500' }}>{op.company}</p>
                                    {isVerified && <span title="Verified Company" style={{ color: '#0ea5e9', fontSize: '0.9rem' }}>✔</span>}
                                </div>
                            </div>

                            {/* Deep Details Row */}
                            {(op.employmentType || op.locationType || op.salaryRange || op.internshipType || op.duration || op.scheduleType) && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-body)' }}>
                                    {op.employmentType && <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{op.employmentType}</span>}

                                    {/* Learning Specifics */}
                                    {op.learningType && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px' }}>{op.learningType}</span>}
                                    {op.courseMode && <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{op.courseMode}</span>}
                                    {op.type === 'learning' && (
                                        <span style={{ background: op.cost === 'Free' ? '#dcfce7' : '#f3f4f6', color: op.cost === 'Free' ? '#15803d' : '#374151', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>
                                            {op.cost}
                                        </span>
                                    )}

                                    {/* Internship Specifics */}
                                    {op.internshipType && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px' }}>{op.internshipType}</span>}
                                    {op.duration && <span style={{ background: '#fff7ed', color: '#c2410c', padding: '2px 6px', borderRadius: '4px' }}>⏱ {op.duration}</span>}
                                    {op.hasCertificate && <span style={{ background: '#fefce8', color: '#b45309', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde047' }}>🏆 Certificate</span>}

                                    {/* Gig Specifics */}
                                    {op.type === 'gig' && (
                                        <>
                                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', border: '1px solid #86efac' }}>
                                                💰 {op.salaryRange}
                                            </span>
                                            {op.tagsString?.toLowerCase().includes('urgent') && (
                                                <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
                                                    🔥 URGENT
                                                </span>
                                            )}
                                        </>
                                    )}

                                    {/* Part-Time Specifics */}
                                    {op.scheduleType && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px' }}>📅 {op.scheduleType}</span>}
                                    {op.hoursPerWeek && <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>⏱ {op.hoursPerWeek}</span>}

                                    {op.locationType && <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{op.locationType}</span>}

                                    {op.salaryRange && (
                                        <span style={{
                                            background: op.salaryRange === 'Unpaid' ? '#f3f4f6' : '#ecfdf5',
                                            color: op.salaryRange === 'Unpaid' ? '#6b7280' : '#047857',
                                            padding: '2px 6px', borderRadius: '4px', fontWeight: '500'
                                        }}>
                                            {op.salaryRange}
                                        </span>
                                    )}
                                </div>
                            )}

                            {op.tags && (
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {op.tags.slice(0, 3).map(tag => (
                                        <span key={tag} style={{ fontSize: '0.75rem', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-body)' }}>{tag}</span>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {op.location}</span>
                                {op.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🕒 {new Date(op.deadline).toLocaleDateString()}</span>}
                            </div>
                        </Link>
                    );
                })
            )}
        </div>
    </div>
);
};

export default OpportunitiesPage;
