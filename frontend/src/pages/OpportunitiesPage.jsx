import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const OpportunitiesPage = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [companyMap, setCompanyMap] = useState({});
    const [loading, setLoading] = useState(true);

    // --- FILTERS STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [datePostedFilter, setDatePostedFilter] = useState('any');
    const [salaryFilter, setSalaryFilter] = useState('any');
    const [budgetTypeFilter, setBudgetTypeFilter] = useState('any'); // New (Gig)
    const [durationFilter, setDurationFilter] = useState('any'); // New (Gig)
    const [eventCostFilter, setEventCostFilter] = useState('any'); // New (Event)
    const [eventDateFilter, setEventDateFilter] = useState('any'); // New (Event)
    const [learningTypeFilter, setLearningTypeFilter] = useState('any'); // New (Learning)
    const [learningCostFilter, setLearningCostFilter] = useState('any'); // New (Learning)
    const [providerFilter, setProviderFilter] = useState('any'); // New (Learning)
    const [expFilter, setExpFilter] = useState('any');
    const [studentFriendly, setStudentFriendly] = useState(false);
    const [locationFilter, setLocationFilter] = useState('any'); // Existing, but moved for clarity in diff
    const [deadlineFilter, setDeadlineFilter] = useState('any'); // New (General Deadline)

    useEffect(() => {
        Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/opportunities`).then(res => res.json()),
            fetch(`${import.meta.env.VITE_API_URL}/companies`).then(res => res.json())
        ]).then(([opsData, companiesData]) => {
            // CRITICAL CHECK: Ensure opsData is an array
            if (!Array.isArray(opsData)) {
                console.error("Expected array for opportunities but got:", opsData);
                setOpportunities([]);
                setLoading(false);
                return;
            }

            // 2️⃣ Normalize details once (CRITICAL)
            const normalizedOps = opsData.map(op => {
                const d = op.details || {};
                return {
                    ...op,
                    ...d,
                    // Robust Fallbacks (Backend might send snake_case)
                    createdAt: op.createdAt || op.created_at || new Date().toISOString(), // Fallback to now if missing
                    learningType: d.learningType || d.learning_type,
                    courseProvider: d.courseProvider || d.provider,
                    cost: d.cost || d.price,
                    experienceLevel: d.experienceLevel || d.experience,
                    locationType: d.locationType || d.workMode,
                    salaryRange: op.salaryRange || d.salary, // Ensure salary matches
                    duration: d.duration || op.duration // Gig duration
                };
            });
            setOpportunities(normalizedOps);

            const map = {};
            if (Array.isArray(companiesData)) {
                companiesData.forEach(c => map[c.id] = c);
            }
            setCompanyMap(map);

            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch", err);
            setLoading(false);
        });
    }, []);

    // --- LOGIC ---
    const filteredOps = opportunities.filter(op => {
        try {
            const type = (op.type || '').toLowerCase();
            const loc = (op.location || '').toLowerCase();
            const locType = (op.locationType || '').toLowerCase();
            const exp = (op.experienceLevel || '').toLowerCase();
            const salary = (op.salaryRange || '').toLowerCase();
            const dur = (op.duration || '').toLowerCase(); // Gig Duration
            const cost = (op.cost || '').toLowerCase();
            const lType = (op.learningType || '').toLowerCase();
            const provider = (op.courseProvider || '').toLowerCase();

            // 0. Search
            const searchLower = searchQuery.toLowerCase();
            if (searchQuery && !op.title?.toLowerCase().includes(searchLower) && !op.company?.toLowerCase().includes(searchLower)) {
                return false;
            }

            // 1. Type
            if (selectedType !== 'all' && type !== selectedType) return false;

            // 2. Location (Work Mode / Event Mode / Learning Mode)
            // Reuse logic for both Job (Remote/Onsite), Event (Online/Physical), Learning (Online/Physical)
            if (locationFilter === 'remote' && (!locType.includes('remote') && !locType.includes('online') && !loc.includes('remote'))) return false;
            if (locationFilter === 'onsite' && (!locType.includes('on-site') && !locType.includes('onsite') && !locType.includes('physical') && !loc.includes('site'))) return false;
            if (locationFilter === 'hybrid' && !locType.includes('hybrid')) return false;

            // 3. Deadline (General)
            // Only apply general deadline filter if NOT doing specific event date filter (to avoid conflict)
            if (eventDateFilter === 'any' && deadlineFilter !== 'any') {
                if (!op.deadline) return false;
                const d = new Date(op.deadline);
                if (isNaN(d.getTime())) return false; // Invalid date check
                const daysLeft = (d - new Date()) / (1000 * 60 * 60 * 24);

                if (deadlineFilter === 'closing_soon' && (daysLeft < 0 || daysLeft > 7)) return false;
                if (deadlineFilter === 'open' && daysLeft < 0) return false; // Filter out expired
            }

            // 3.5 Date Posted (Freshness)
            if (datePostedFilter !== 'any') {
                const created = new Date(op.createdAt);
                if (isNaN(created.getTime())) return false; // Skip invalid dates
                const now = new Date();
                const diffTime = Math.abs(now - created);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (datePostedFilter === 'today' && diffDays > 1) return false;
                if (datePostedFilter === '3days' && diffDays > 3) return false;
                if (datePostedFilter === '7days' && diffDays > 7) return false;
                if (datePostedFilter === '30days' && diffDays > 30) return false;
            }

            // 4. Experience
            if (expFilter !== 'any') {
                if (expFilter === 'no_experience') {
                    // Check for explicit "No Experience" or implied by empty?
                    // Usually "No Experience" is explicit. Or maybe "Entry Level" covers it?
                    // Let's assume explicit check + 'none'
                    if (!exp.includes('no experience') && !exp.includes('none')) return false;
                }
                else if (!exp.includes(expFilter)) return false;
            }

            // 5. Salary (New)
            if (salaryFilter !== 'any') {
                const isUnpaid = salary.includes('unpaid') || salary.includes('volunteer');
                if (salaryFilter === 'paid' && isUnpaid) return false;
                if (salaryFilter === 'unpaid' && !isUnpaid) return false;
            }

            // 6. Gig Specific: Budget Type & Duration
            if (budgetTypeFilter !== 'any') {
                const isHourly = salary.includes('hour') || salary.includes('/hr');
                if (budgetTypeFilter === 'hourly' && !isHourly) return false;
                if (budgetTypeFilter === 'fixed' && isHourly) return false;
            }

            if (durationFilter !== 'any') {
                // Simple string matching
                if (!dur.includes(durationFilter)) return false;
                // Note: 'short-term' vs 'short term', we rely on basic matching for now
            }

            // 8. Event Specific: Cost & Date
            if (eventCostFilter !== 'any') {
                const isFree = cost === 'free' || cost.includes('0') || cost === '';
                // Note: cost might be string '0' or 'free'.
                if (eventCostFilter === 'free' && !isFree) return false;
                if (eventCostFilter === 'paid' && isFree) return false;
            }

            if (eventDateFilter !== 'any') {
                if (!op.deadline) return false; // Assume deadline = event date
                const eventDate = new Date(op.deadline);
                if (isNaN(eventDate.getTime())) return false;

                const now = new Date();
                const diffTime = eventDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (eventDateFilter === 'week' && (diffDays < 0 || diffDays > 7)) return false;
                if (eventDateFilter === 'month' && (diffDays < 0 || diffDays > 30)) return false;
                if (eventDateFilter === 'upcoming' && diffDays < 0) return false; // Past events
            }

            // 9. Learning Specific
            if (learningTypeFilter !== 'any') {
                // Partial match for types like 'online course' vs 'course'
                if (!lType.includes(learningTypeFilter)) return false;
            }

            if (learningCostFilter !== 'any') {
                const isFree = cost === 'free' || cost.includes('0') || cost === '';
                const isFunded = cost.includes('funded') || cost.includes('scholarship');

                if (learningCostFilter === 'free' && !isFree) return false;
                if (learningCostFilter === 'paid' && (isFree || isFunded)) return false;
                if (learningCostFilter === 'fully_funded' && !isFunded) return false;
            }

            if (providerFilter !== 'any') {
                if (!provider.includes(providerFilter)) return false;
            }


            // 7. Student Friendly
            if (studentFriendly) {
                const isIntern = type === 'internship';
                const isLearning = type === 'learning';
                const isEntry = exp.includes('entry');
                const isFree = (op.cost || '').toLowerCase() === 'free' || (op.registrationType || '').toLowerCase() === 'free';
                if (!isIntern && !isLearning && !isEntry && !isFree) return false;
            }

            return true;
        } catch (e) {
            console.warn("Filter validation error on op", op, e);
            return true; // Keep faulty ops visible but logged, or return false to hide
        }
    });

    const sortedOps = [...filteredOps].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Safe sort
    });

    // Dynamic Filter Visibility
    // User requested to HIDE specific filters when 'All' is selected to avoid clutter.
    const isJobLike = ['job', 'internship', 'part-time'].includes(selectedType);
    const isGigLike = ['gig'].includes(selectedType);
    const isEventLike = ['event'].includes(selectedType);
    const isLearningLike = ['learning'].includes(selectedType);

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

                {/* Bottom: Dynamic Dropdowns Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>

                    {/* Universal Filters */}
                    {(!isEventLike && !isLearningLike) && (
                        <div className="select-wrapper">
                            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                                <option value="any">🌍 Location: Any</option>
                                <option value="remote">🏠 Remote</option>
                                <option value="onsite">🏢 On-site</option>
                                <option value="hybrid">🔄 Hybrid</option>
                            </select>
                        </div>
                    )}

                    <div className="select-wrapper">
                        <select value={datePostedFilter} onChange={(e) => setDatePostedFilter(e.target.value)}>
                            <option value="any">🕒 Date: Any Time</option>
                            <option value="today">Today</option>
                            <option value="3days">Last 3 Days</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                        </select>
                    </div>

                    {(selectedType === 'all' || isJobLike || isGigLike) && (
                        <div className="select-wrapper">
                            <select value={deadlineFilter} onChange={(e) => setDeadlineFilter(e.target.value)}>
                                <option value="any">⏳ Deadline: Any</option>
                                <option value="open">Still Open</option>
                                <option value="closing_soon">Closing Soon (≤ 7 days)</option>
                            </select>
                        </div>
                    )}

                    {/* Job/Intern Filters */}
                    {isJobLike && (
                        <>
                            <div className="select-wrapper">
                                <select value={expFilter} onChange={(e) => setExpFilter(e.target.value)}>
                                    <option value="any">🧠 Experience: Any</option>
                                    <option value="no_experience">👶 No Experience</option>
                                    <option value="entry">🌱 Entry Level</option>
                                    <option value="mid">🚀 Mid Level</option>
                                    <option value="senior">👴 Senior</option>
                                </select>
                            </div>
                            <div className="select-wrapper">
                                <select value={salaryFilter} onChange={(e) => setSalaryFilter(e.target.value)}>
                                    <option value="any">💰 Salary: Any</option>
                                    <option value="paid">✅ Paid</option>
                                    <option value="unpaid">🚫 Unpaid</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Gig Filters */}
                    {isGigLike && (
                        <>
                            <div className="select-wrapper">
                                <select value={budgetTypeFilter} onChange={(e) => setBudgetTypeFilter(e.target.value)}>
                                    <option value="any">💰 Budget: Any</option>
                                    <option value="fixed">Fixed Price</option>
                                    <option value="hourly">Hourly Rate</option>
                                </select>
                            </div>
                            <div className="select-wrapper">
                                <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)}>
                                    <option value="any">⏱️ Duration: Any</option>
                                    <option value="1 day">1 Day</option>
                                    <option value="1 week">1 Week</option>
                                    <option value="short-term">Short-term</option>
                                    <option value="long-term">Long-term</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Event Filters */}
                    {isEventLike && (
                        <>
                            <div className="select-wrapper">
                                <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                                    <option value="any">📍 Mode: Any</option>
                                    <option value="remote">💻 Online</option>
                                    <option value="onsite">🏃 Physical</option>
                                    <option value="hybrid">🔄 Hybrid</option>
                                </select>
                            </div>
                            <div className="select-wrapper">
                                <select value={eventDateFilter} onChange={(e) => setEventDateFilter(e.target.value)}>
                                    <option value="any">📅 Date: Any</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="upcoming">All Upcoming</option>
                                </select>
                            </div>
                            <div className="select-wrapper">
                                <select value={eventCostFilter} onChange={(e) => setEventCostFilter(e.target.value)}>
                                    <option value="any">🎟️ Cost: Any</option>
                                    <option value="free">🎉 Free</option>
                                    <option value="paid"> Paid</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Learning Filters */}
                    {isLearningLike && (
                        <>
                            <div className="select-wrapper">
                                <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                                    <option value="any">🎓 Mode: Any</option>
                                    <option value="remote">💻 Online</option>
                                    <option value="onsite">🏫 Physical</option>
                                    <option value="hybrid">🔄 Hybrid</option>
                                </select>
                            </div>
                            <div className="select-wrapper">
                                <select value={learningTypeFilter} onChange={(e) => setLearningTypeFilter(e.target.value)}>
                                    <option value="any">📚 Type: All</option>
                                    <option value="course">Course</option>
                                    <option value="scholarship">Scholarship</option>
                                    <option value="bootcamp">Bootcamp</option>
                                    <option value="fellowship">Fellowship</option>
                                    <option value="certification">Certification</option>
                                </select>
                            </div>
                            <div className="select-wrapper">
                                <select value={learningCostFilter} onChange={(e) => setLearningCostFilter(e.target.value)}>
                                    <option value="any">💸 Cost: Any</option>
                                    <option value="free">🎉 Free</option>
                                    <option value="paid">💵 Paid</option>
                                    <option value="fully_funded">🏆 Fully Funded</option>
                                </select>
                            </div>
                            <div className="select-wrapper">
                                <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
                                    <option value="any">🏛️ Provider: All</option>
                                    <option value="google">Google</option>
                                    <option value="coursera">Coursera</option>
                                    <option value="alx">ALX</option>
                                    <option value="university">University</option>
                                    <option value="ngo">NGO</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- RESULTS --- */}
            <div style={{ marginBottom: '1rem', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem' }}>
                Found {sortedOps.length} opportunities
            </div>

            <div className="grid-cards">
                {sortedOps.map(op => {
                    const isStudent = (op.type === 'internship' || op.type === 'learning' || (op.experienceLevel || '').toLowerCase().includes('entry') || (op.cost || '').toLowerCase() === 'free');

                    // Safe Date Formatter
                    const formatDate = (dateStr) => {
                        if (!dateStr) return null;
                        const d = new Date(dateStr);
                        return isNaN(d.getTime()) ? null : d.toLocaleDateString();
                    };
                    const formattedDeadline = formatDate(op.deadline);

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
                                {formattedDeadline && <span className="tag-pill red">⏰ {formattedDeadline}</span>}
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
                /* --- PREMIUM INPUTS & SELECTS --- */
                .search-input {
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
                }
                .search-input:focus {
                    border-color: #3b82f6 !important;
                    background: white !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .filter-card {
                    background: rgba(255, 255, 255, 0.95) !important;
                    backdrop-filter: blur(10px);
                }

                /* Compact Selects (Pill Style) */
                .select-wrapper { display: flex; flexDirection: column; }
                .select-wrapper select {
                    appearance: none;
                    padding: 0.7rem 1.2rem;
                    border-radius: 99px; /* Pill Shape */
                    border: 1px solid #e2e8f0;
                    background-color: white;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3e%3c/path%3e%3c/svg%3e");
                    background-repeat: no-repeat;
                    background-position: right 1rem center;
                    background-size: 1rem;
                    font-size: 0.9rem;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    outline: none;
                    font-weight: 600;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .select-wrapper select:hover {
                    border-color: #cbd5e1;
                    transform: translateY(-1px);
                    background-color: #f8fafc;
                }
                .select-wrapper select:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                /* --- PILLS --- */
                .filter-pill {
                    display: flex; alignItems: center; gap: 8px;
                    padding: 0.7rem 1.4rem;
                    border-radius: 99px;
                    border: 1px solid transparent;
                    background: #f1f5f9;
                    color: #64748b;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 0.95rem;
                    white-space: nowrap;
                }
                .filter-pill:hover {
                    background: #e2e8f0;
                    transform: translateY(-2px);
                    color: #334155;
                }
                .filter-pill.active {
                    background: #2563eb;
                    color: white;
                    box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.3);
                    border-color: transparent;
                }
                .filter-pill.active .icon { opacity: 1; }

                /* --- CARDS --- */
                .grid-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .opportunity-card {
                    display: flex;
                    flex-direction: column;
                    background: white;
                    border-radius: 24px;
                    padding: 1.5rem;
                    text-decoration: none;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    height: 100%;
                }
                .opportunity-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                    border-color: #e2e8f0;
                }

                .card-logo {
                    width: 64px; height: 64px;
                    min-width: 64px;
                    border-radius: 18px;
                    background: #f8fafc;
                    display: flex; alignItems: center; justifyContent: center;
                    font-size: 2rem;
                    border: 2px solid white;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    transition: transform 0.3s ease;
                }
                .opportunity-card:hover .card-logo { transform: scale(1.05); }
                .card-logo img { width: 100%; height: 100%; object-fit: cover; }

                .card-title {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0 0 0.25rem 0;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .card-company {
                    font-size: 0.95rem;
                    color: #64748b;
                    margin: 0;
                    font-weight: 500;
                }

                .card-badges {
                    position: absolute;
                    top: 1rem; right: 1rem;
                    display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;
                }
                .badge {
                    font-size: 0.7rem;
                    padding: 4px 10px;
                    border-radius: 99px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .badge-student { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
                .badge-featured { background: #eff6ff; color: #3b82f6; border: 1px solid #dbeafe; }

                .card-tags {
                    display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto;
                    padding-top: 1rem;
                }
                .tag-pill {
                    font-size: 0.8rem;
                    padding: 6px 12px;
                    background: #f8fafc;
                    color: #64748b;
                    border-radius: 12px;
                    font-weight: 600;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .opportunity-card:hover .tag-pill { background: #f1f5f9; border-color: #e2e8f0; }

                .tag-pill.type-job { background: #e0f2fe; color: #0284c7; }
                .tag-pill.type-internship { background: #fdf4ff; color: #c026d3; }
                .tag-pill.type-gig { background: #fff1f2; color: #e11d48; }
                .tag-pill.type-event { background: #f0fdf4; color: #16a34a; }
                .tag-pill.type-learning { background: #fffbeb; color: #d97706; }

                .tag-pill.green { background: #ecfdf5; color: #059669; }
                .tag-pill.red { background: #fef2f2; color: #dc2626; }

                /* --- MOBILE RESPONSIVENESS --- */
                @media (max-width: 640px) {
                    .container { padding: 1rem 12px !important; }
                    .grid-cards { grid-template-columns: 1fr; gap: 1rem; }
                    .student-toggle { width: 100%; justify-content: center; margin-top: 0.5rem; }
                    .filter-card { padding: 1.2rem !important; border-radius: 20px !important; }
                    .select-wrapper label { font-size: 0.65rem; }
                    .card-title { font-size: 1.1rem; }
                }
            `}</style>
        </div>
    );
};

export default OpportunitiesPage;
