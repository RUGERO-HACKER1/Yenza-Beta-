import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const OpportunitiesPage = () => {
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
            fetch('http://localhost:5000/opportunities').then(res => res.json()),
            fetch('http://localhost:5000/companies').then(res => res.json())
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
                        {['job', 'internship', 'part-time', 'event', 'gig'].map(type => (
                            <button key={type} onClick={() => handleTypeToggle(type)} className={`btn ${selectedTypes.includes(type) ? 'btn-secondary' : 'btn-outline'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                                {selectedTypes.includes(type) && <span style={{ marginRight: '4px' }}>✓</span>} {type}
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
                                        {companyMap[op.companyId]?.logo ? <img src={companyMap[op.companyId].logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : (op.type === 'job' ? '💼' : op.type === 'part-time' ? '⏳' : op.type === 'gig' ? '⚡' : '🎓')}
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
