import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const OpportunitiesPage = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [companyMap, setCompanyMap] = useState({});
    const [loading, setLoading] = useState(true);

    // --- FILTERS STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [locationFilter, setLocationFilter] = useState('any');
    const [deadlineFilter, setDeadlineFilter] = useState('any');
    const [expFilter, setExpFilter] = useState('any');
    const [studentFriendly, setStudentFriendly] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/opportunities`).then(res => res.json()),
            fetch(`${import.meta.env.VITE_API_URL}/companies`).then(res => res.json())
        ]).then(([opsData, companiesData]) => {
            // 2️⃣ Normalize details once (CRITICAL)
            const normalizedOps = opsData.map(op => {
                const d = op.details || {};
                return {
                    ...op,
                    ...d,
                    learningType: d.learningType || d.learning_type,
                    courseProvider: d.courseProvider || d.provider,
                    cost: d.cost || d.price,
                    experienceLevel: d.experienceLevel || d.experience,
                    locationType: d.locationType || d.workMode,
                };
            });
            setOpportunities(normalizedOps);

            const map = {};
            companiesData.forEach(c => map[c.id] = c);
            setCompanyMap(map);

            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch", err);
            setLoading(false);
        });
    }, []);

    // --- LOGIC ---
    const filteredOps = opportunities.filter(op => {
        const type = (op.type || '').toLowerCase();
        const loc = (op.location || '').toLowerCase();
        const locType = (op.locationType || '').toLowerCase();
        const exp = (op.experienceLevel || '').toLowerCase();

        // 0. Search
        const searchLower = searchQuery.toLowerCase();
        if (searchQuery && !op.title?.toLowerCase().includes(searchLower) && !op.company?.toLowerCase().includes(searchLower)) {
            return false;
        }

        // 1. Type
        if (selectedType !== 'all' && type !== selectedType) return false;

        // 2. Location
        if (locationFilter === 'remote' && (!locType.includes('remote') && !loc.includes('remote'))) return false;
        if (locationFilter === 'onsite' && (!locType.includes('on-site') && !locType.includes('onsite') && !loc.includes('site'))) return false;
        if (locationFilter === 'hybrid' && !locType.includes('hybrid')) return false;

        // 3. Deadline
        if (deadlineFilter === 'soon') {
            if (!op.deadline) return false;
            const daysLeft = (new Date(op.deadline) - new Date()) / (1000 * 60 * 60 * 24);
            if (daysLeft < 0 || daysLeft > 14) return false;
        }

        // 4. Experience
        if (expFilter !== 'any' && !exp.includes(expFilter)) return false;

        // 5. Student Friendly
        if (studentFriendly) {
            const isIntern = type === 'internship';
            const isLearning = type === 'learning';
            const isEntry = exp.includes('entry');
            const isFree = (op.cost || '').toLowerCase() === 'free' || (op.registrationType || '').toLowerCase() === 'free';
            if (!isIntern && !isLearning && !isEntry && !isFree) return false;
        }

        return true;
    });

    const sortedOps = [...filteredOps].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader"></div>
            <style>{`.loader { border: 4px solid #f3f4f6; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="container" style={{ padding: '2rem 24px', minHeight: '80vh', maxWidth: '1200px', margin: '0 auto' }}>

            {/* --- HEADER --- */}
            <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #1e293b, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Find Your Next Step
                </h2>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Discover jobs, internships, events, and learning opportunities tailored for you.</p>
            </div>

            {/* --- PREMIUM FILTER BAR --- */}
            <div className="filter-card" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(229, 231, 235, 0.5)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', marginBottom: '3rem' }}>

                {/* Top: Search & Student Toggle */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
                        <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', color: '#9ca3af' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search title, company, or keyword..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '1rem 1rem 1rem 3.5rem',
                                borderRadius: '16px', border: '2px solid #f3f4f6',
                                fontSize: '1rem', transition: 'all 0.2s', outline: 'none',
                                backgroundColor: '#f9fafb'
                            }}
                            className="search-input"
                        />
                    </div>

                    {/* ⭐ GOLD STUDENT TOGGLE */}
                    <label
                        className={`student-toggle ${studentFriendly ? 'active' : ''}`}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.8rem 1.5rem', borderRadius: '16px', cursor: 'pointer',
                            border: studentFriendly ? '2px solid #fbbf24' : '2px solid #f3f4f6',
                            background: studentFriendly ? '#fffbeb' : 'white',
                            transition: 'all 0.3s ease', userSelect: 'none'
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={studentFriendly}
                            onChange={(e) => setStudentFriendly(e.target.checked)}
                            style={{ display: 'none' }}
                        />
                        <span style={{ fontSize: '1.2rem' }}>{studentFriendly ? '⭐' : '🎓'}</span>
                        <div>
                            <span style={{ display: 'block', fontWeight: '800', fontSize: '0.9rem', color: studentFriendly ? '#92400e' : '#374151' }}>Student Friendly</span>
                            {studentFriendly && <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '500' }}>Active</span>}
                        </div>
                    </label>
                </div>

                <div style={{ height: '1px', background: '#f3f4f6', marginBottom: '1.5rem' }}></div>

                {/* Middle: Type Pills */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.05em' }}>Category</span>
                    <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
                        {[
                            { id: 'all', label: 'All', icon: '🌐' },
                            { id: 'job', label: 'Jobs', icon: '💼' },
                            { id: 'internship', label: 'Internships', icon: '🎓' },
                            { id: 'learning', label: 'Learning', icon: '📚' },
                            { id: 'event', label: 'Events', icon: '📅' },
                            { id: 'gig', label: 'Freelance', icon: '⚡' }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`filter-pill ${selectedType === type.id ? 'active' : ''}`}
                            >
                                <span className="icon">{type.icon}</span>
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom: Dropdowns Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                    <div className="select-wrapper">
                        <label>Location</label>
                        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                            <option value="any">🌍 Anywhere</option>
                            <option value="remote">🏠 Remote Only</option>
                            <option value="onsite">🏢 On-site</option>
                            <option value="hybrid">🔄 Hybrid</option>
                        </select>
                    </div>
                    <div className="select-wrapper">
                        <label>Deadline</label>
                        <select value={deadlineFilter} onChange={(e) => setDeadlineFilter(e.target.value)}>
                            <option value="any">📅 All Dates</option>
                            <option value="soon">🔥 Closing Soon (14d)</option>
                        </select>
                    </div>
                    <div className="select-wrapper">
                        <label>Experience</label>
                        <select value={expFilter} onChange={(e) => setExpFilter(e.target.value)}>
                            <option value="any">⚡ Any Level</option>
                            <option value="entry">🌱 Entry Level</option>
                            <option value="mid">🚀 Mid Level</option>
                            <option value="senior">🧠 Senior</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- RESULTS --- */}
            <div style={{ marginBottom: '1rem', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem' }}>
                Found {sortedOps.length} opportunities
            </div>

            <div className="grid-cards">
                {sortedOps.map(op => {
                    const isStudent = (op.type === 'internship' || op.type === 'learning' || (op.experienceLevel || '').toLowerCase().includes('entry') || (op.cost || '').toLowerCase() === 'free');

                    return (
                        <Link to={`/opportunities/${op.id}`} key={op.id} className="opportunity-card">
                            {/* Badges */}
                            <div className="card-badges">
                                {isStudent && <span className="badge badge-student">⭐ Student</span>}
                                {op.isFeatured && <span className="badge badge-featured">✨ Featured</span>}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="card-logo">
                                    {companyMap[op.companyId]?.logo ?
                                        <img src={companyMap[op.companyId].logo} alt="" /> :
                                        <span>{op.type === 'job' ? '💼' : op.type === 'event' ? '📅' : '⚡'}</span>
                                    }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 className="card-title">{op.title}</h3>
                                    <p className="card-company">{op.company}</p>
                                </div>
                            </div>

                            <div className="card-tags">
                                <span className={`tag-pill type-${op.type}`}>{op.type}</span>
                                {op.location && <span className="tag-pill">📍 {op.location}</span>}
                                {op.salaryRange && op.salaryRange !== 'Unpaid' && <span className="tag-pill green">💰 {op.salaryRange}</span>}
                                {op.deadline && <span className="tag-pill red">⏰ {new Date(op.deadline).toLocaleDateString()}</span>}
                            </div>
                        </Link>
                    )
                })}
            </div>

            {sortedOps.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '24px', border: '2px dashed #e5e7eb' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🙈</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>No results found</h3>
                    <p style={{ color: '#6b7280', marginBottom: '2rem' }}>try adjusting your filters to see more opportunities.</p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedType('all'); setLocationFilter('any'); }}
                        style={{ padding: '0.8rem 2rem', background: '#3b82f6', color: 'white', fontWeight: 'bold', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {/* --- STYLES --- */}
            <style>{`
                .search-input:focus { border-color: #3b82f6 !important; background: white !important; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                
                .filter-pill {
                    display: flex; alignItems: center; gap: 6px;
                    padding: 0.6rem 1.2rem;
                    border-radius: 99px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    color: #64748b;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.95rem;
                }
                .filter-pill:hover { background: #f8fafc; transform: translateY(-1px); }
                .filter-pill.active {
                    background: #eff6ff;
                    border-color: #3b82f6;
                    color: #2563eb;
                    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
                }

                .select-wrapper { display: flex; flexDirection: column; gap: 6px; }
                .select-wrapper label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                .select-wrapper select {
                    padding: 0.8rem;
                    border-radius: 12px;
                    border: 2px solid #f3f4f6;
                    background: #f9fafb;
                    font-size: 0.95rem;
                    color: #334155;
                    cursor: pointer;
                    transition: border-color 0.2s;
                    outline: none;
                }
                .select-wrapper select:focus { border-color: #cbd5e1; background: white; }

                .grid-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                }

                .opportunity-card {
                    display: block;
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    text-decoration: none;
                    border: 1px solid #e2e8f0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                .opportunity-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                    border-color: #cbd5e1;
                }

                .card-logo {
                    width: 56px; height: 56px;
                    border-radius: 14px;
                    background: #f1f5f9;
                    display: flex; alignItems: center; justifyContent: center;
                    font-size: 1.75rem;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                }
                .card-logo img { width: 100%; height: 100%; object-fit: cover; }

                .card-title { font-size: 1.15rem; fontWeight: 700; color: #0f172a; margin: 0 0 0.25rem 0; line-height: 1.3; }
                .card-company { font-size: 0.95rem; color: #64748b; margin: 0; font-weight: 500; }

                .card-badges { position: absolute; top: 1rem; right: 1rem; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; }
                .badge { font-size: 0.75rem; padding: 4px 10px; border-radius: 99px; fontWeight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
                .badge-student { background: #fffbeb; color: #b45309; border: 1px solid #fcd34d; }
                .badge-featured { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

                .card-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; }
                .tag-pill { font-size: 0.8rem; padding: 4px 10px; background: #f8fafc; color: #475569; border-radius: 8px; font-weight: 600; }
                .tag-pill.type-job { background: #e0f2fe; color: #0369a1; }
                .tag-pill.green { background: #dcfce7; color: #15803d; }
                .tag-pill.red { background: #fee2e2; color: #b91c1c; }

                @media (max-width: 640px) {
                    .container { padding: 1.5rem 16px !important; }
                    .grid-cards { grid-template-columns: 1fr; }
                    .student-toggle { width: 100%; justify-content: center; margin-top: 0.5rem; }
                    .filter-card { padding: 1rem; }
                }
            `}</style>
        </div>
    );
};

export default OpportunitiesPage;
