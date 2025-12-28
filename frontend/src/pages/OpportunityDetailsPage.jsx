import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OpportunityDetailsPage = () => {
    const { id } = useParams();
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [op, setOp] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showExternalModal, setShowExternalModal] = useState(false); // Phase 18
    const [appForm, setAppForm] = useState({ fullName: '', email: '', cvLink: '', coverNote: '', offerAmount: '', portfolioLink: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        console.log("Fetching details for ID:", id);
        // Fetch Opportunity
        fetch(`${import.meta.env.VITE_API_URL}/opportunities/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => {
                console.log("Opportunity Data:", data);
                setOp(data);

                // Fetch Company Details if available
                if (data.companyId && data.companyId !== 'admin-manual') {
                    fetch(`${import.meta.env.VITE_API_URL}/companies/${data.companyId}`)
                        .then(res => res.json())
                        .then(comp => {
                            console.log("Company Data:", comp);
                            setCompanyDetails(comp);
                        })
                        .catch(err => console.error("Failed to fetch company", err));
                }

                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch Error:", err);
                setLoading(false);
            });

        // Check if applied (if user is logged in)
        if (user && user.role === 'user') {
            fetch(`${import.meta.env.VITE_API_URL}/applications?userId=${user.id}&opportunityId=${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length > 0) setHasApplied(true);
                });

            // Pre-fill form
            setAppForm(prev => ({ ...prev, fullName: user.name || '', email: user.email || '' }));
        }
    }, [id, user]);

    // Toggle Bookmark
    const toggleBookmark = async () => {
        if (!user || user.role !== 'user') {
            alert("Please log in as a talent to bookmark.");
            return;
        }

        const isBookmarked = user.bookmarks?.includes(op.id);
        let newBookmarks;

        if (isBookmarked) {
            newBookmarks = user.bookmarks.filter(b => b !== op.id);
        } else {
            newBookmarks = [...(user.bookmarks || []), op.id];
        }

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookmarks: newBookmarks })
            });
            login({ ...user, bookmarks: newBookmarks });
        } catch (err) {
            console.error("Failed to bookmark", err);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id || 'guest',
                    opportunityId: op.id,
                    ...appForm
                })
            });
            if (res.ok) {
                setHasApplied(true);
                setShowModal(false);
                alert("Application sent successfully!");

                // Notify Company
                if (op.companyId) {
                    let msg = `New applicant for ${op.title}: ${appForm.fullName}`;
                    if (op.type === 'gig' && appForm.offerAmount) msg = `New Offer (${appForm.offerAmount}) for ${op.title} from ${appForm.fullName}`;
                    if (op.type === 'event') msg = `New RSVP for ${op.title}: ${appForm.fullName}`;

                    fetch(`${import.meta.env.VITE_API_URL}/notifications`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: op.companyId,
                            message: msg,
                            type: 'info',
                            relatedId: op.id
                        })
                    }).catch(console.error);
                }

            } else {
                const d = await res.json();
                alert(d.message || "Failed to apply");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    // ... (rest of component loading checks) ...

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading details... (Check Console)</div>;
    if (!op || Object.keys(op).length === 0) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Opportunity not found <br /> <Link to="/opportunities">Back to list</Link></div>;

    const shareUrl = window.location.href; // Keep for possible use
    const isSaved = user?.bookmarks?.includes(op.id);

    const getCTA = (type) => {
        if (op.applicationMethod === 'external') return 'Apply on Company Website ↗';

        if (!type) return 'Apply Now';
        switch (type) {
            case 'job': return 'Apply Now 🚀';
            case 'internship': return 'Apply for Internship 🎓';
            case 'part-time': return 'Quick Apply ⏳';
            case 'event': return 'Register / RSVP 📅';
            case 'gig': return 'Send Offer ⚡';
            case 'learning': return 'Enroll Now 🏫';
            default: return 'Apply Now';
        }
    };

    const renderApplicationModal = () => (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ marginBottom: '1rem' }}>
                    {op.type === 'event' ? 'Confirm Registration' : op.type === 'gig' ? 'Submit Proposal' : `Apply for ${op.title}`}
                </h2>

                <form onSubmit={handleApply}>
                    {/* JOB Application Fields */}
                    {(op.type === 'job') && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>Full Name</label>
                                    <input required type="text" value={appForm.fullName} onChange={e => setAppForm({ ...appForm, fullName: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }} />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>Email</label>
                                    <input required type="email" value={appForm.email} onChange={e => setAppForm({ ...appForm, email: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>CV / Resume Link *</label>
                                <input required type="url" placeholder="https://drive.google.com/..." value={appForm.cvLink} onChange={e => setAppForm({ ...appForm, cvLink: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }} />
                            </div>
                        </>
                    )}

                    {/* PART-TIME QUICK APPLY */}
                    {op.type === 'part-time' && (
                        <>
                            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>⚡ <strong>Quick Apply:</strong> No CV required. Just introduce yourself!</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>Full Name</label>
                                    <input required type="text" value={appForm.fullName} onChange={e => setAppForm({ ...appForm, fullName: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }} />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>Best Contact (Email or Phone) *</label>
                                    <input required type="text" value={appForm.email} onChange={e => setAppForm({ ...appForm, email: e.target.value })} placeholder="email@example.com or 07..." style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>Short Message to Employer *</label>
                                <textarea required rows="3" value={appForm.coverNote} onChange={e => setAppForm({ ...appForm, coverNote: e.target.value })} placeholder="Hi, I'm available for evening shifts and live nearby..." style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }}></textarea>
                            </div>
                        </>
                    )}

                    {/* INTERNSHIP Application Fields */}
                    {op.type === 'internship' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>Full Name</label>
                                    <input required type="text" value={appForm.fullName} onChange={e => setAppForm({ ...appForm, fullName: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }} />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>Email</label>
                                    <input required type="email" value={appForm.email} onChange={e => setAppForm({ ...appForm, email: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>Motivation / Why do you want this? *</label>
                                <textarea required rows="4" value={appForm.coverNote} onChange={e => setAppForm({ ...appForm, coverNote: e.target.value })} placeholder="I am passionate about this field because..." style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }}></textarea>
                            </div>
                        </>
                    )}

                    {/* GIG / EVENT */}
                    {op.type === 'gig' && (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>Your Offer (Budget)</label>
                                <input required value={appForm.offerAmount} onChange={e => setAppForm({ ...appForm, offerAmount: e.target.value })} placeholder={`e.g. ${op.budget || '$500'}`} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>Portfolio Link</label>
                                <input required type="url" placeholder="https://..." value={appForm.portfolioLink} onChange={e => setAppForm({ ...appForm, portfolioLink: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px' }} />
                            </div>
                        </>
                    )}

                    {op.type === 'event' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p>Confirm your attendance for <strong>{op.title}</strong>?</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>We will send a calendar invite to <strong>{user.email}</strong>.</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Processing...' : op.type === 'event' ? 'Confirm RSVP' : op.type === 'gig' ? 'Send Offer' : 'Submit Application'}</button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderExternalApplyModal = () => {
        // Extract domain for safety display
        const targetUrl = op.enrollLink || op.externalApplyUrl;
        let domain = 'external site';
        try {
            domain = new URL(targetUrl).hostname;
        } catch (e) { }

        const handleContinue = () => {
            // Track the click (Optimistic - fire and forget)
            fetch(`${import.meta.env.VITE_API_URL}/opportunities/${op.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ externalClicks: (op.externalClicks || 0) + 1 })
            }).catch(console.error);

            window.open(targetUrl, '_blank');
            setShowExternalModal(false);
        };

        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                    <h2 style={{ marginBottom: '1rem', color: '#1F2937' }}>You are leaving Yenza</h2>
                    <p style={{ color: '#4B5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        You are about to visit <strong>{domain}</strong> to apply for this position.
                    </p>

                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'left' }}>
                        <p style={{ fontWeight: 'bold', color: '#B91C1C', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ Safety Tip</p>
                        <p style={{ fontSize: '0.9rem', color: '#7F1D1D' }}>
                            Never pay money to apply for a job or internship on Yenza. If you are asked to pay, please report it immediately.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={() => setShowExternalModal(false)} className="btn btn-outline" style={{ padding: '0.8rem 1.5rem' }}>Cancel</button>
                        <button onClick={handleContinue} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Continue to Application ↗</button>
                    </div>
                </div>
            </div>
        );
    };

    // --- LEARNING LAYOUT ---
    if (op.type === 'learning') {
        return (
            <div className="container" style={{ padding: '4rem 24px', maxWidth: '1100px' }}>
                <Link to="/opportunities" style={{ color: 'var(--text-light)', marginBottom: '1rem', display: 'inline-block' }}>&larr; Back to Opportunities</Link>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: '4rem' }}>
                    {/* LEFT CONTENT */}
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>{op.learningType}</span>
                            {op.scholarshipAvailable && <span style={{ background: '#FFFBEB', color: '#D97706', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>🎓 Scholarship Available</span>}
                        </div>

                        <h1 style={{ fontSize: '2.8rem', fontWeight: '800', marginBottom: '1rem', lineHeight: 1.1 }}>{op.title}</h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', marginBottom: '2rem' }}>
                            Offered by <strong style={{ color: 'var(--text-main)' }}>{op.courseProvider}</strong>
                        </p>

                        {op.bannerImage && (
                            <img src={op.bannerImage} alt={op.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '16px', marginBottom: '2.5rem', boxShadow: 'var(--shadow-md)' }} />
                        )}

                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>About this Course</h3>
                            <div style={{ fontSize: '1.15rem', lineHeight: '1.8', color: 'var(--text-body)', whiteSpace: 'pre-line' }}>
                                {op.description}
                            </div>
                        </div>

                        {op.skillsGained && (
                            <div style={{ marginBottom: '3rem' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Skills you'll gain</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                    {op.skillsGained.split(',').map((s, i) => (
                                        <span key={i} style={{ background: '#ECFDF5', color: '#047857', padding: '8px 16px', borderRadius: '24px', fontWeight: '600', fontSize: '1rem' }}>✔ {s.trim()}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', position: 'sticky', top: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: op.cost === 'Free' ? '#10B981' : 'var(--text-main)' }}>
                                    {op.cost === 'Free' ? 'Free' : 'Paid'}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                    {op.cost === 'Paid' ? 'Check provider site' : 'Online / Open'}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowExternalModal(true)}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', marginBottom: '2rem', fontWeight: 'bold', boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)' }}
                            >
                                Enroll on Provider Site ↗
                            </button>

                            <div style={{ display: 'grid', gap: '1.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>⏳ Duration</span>
                                    <span style={{ fontWeight: '600' }}>{op.duration || 'Self-paced'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>📍 Mode</span>
                                    <span style={{ fontWeight: '600' }}>{op.courseMode || 'Online'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>📊 Level</span>
                                    <span style={{ fontWeight: '600' }}>{op.experienceLevel || 'All Levels'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>🏅 Certificate</span>
                                    <span style={{ fontWeight: '600' }}>{op.certificateOffered ? 'Yes Included' : 'No'}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                                <button onClick={toggleBookmark} style={{ background: 'none', border: 'none', color: isSaved ? '#D97706' : 'var(--text-light)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                                    {isSaved ? '⭐ Saved to Favorites' : '☆ Save for Later'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {showExternalModal && renderExternalApplyModal()}
            </div>
        );
    }

    // --- EVENT LAYOUT ---
    if (op.type === 'event') {
        const eventDate = op.startDate ? new Date(op.startDate) : new Date();
        return (
            <div style={{ paddingBottom: '4rem' }}>
                {/* Full Width Banner */}
                <div style={{ height: '350px', position: 'relative', background: '#111827' }}>
                    <img src={op.bannerImage || 'https://via.placeholder.com/1200x500?text=Event+Banner'} alt={op.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                    <div className="container" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', padding: '2rem 24px', width: '100%', maxWidth: '1200px', color: 'white' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                            <span style={{ background: '#ef4444', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{op.eventType || 'Event'}</span>
                            <span style={{ background: 'white', color: 'black', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>{op.registrationType === 'Free' ? 'Free Entry' : `${op.salaryCurrency || 'RWF'} ${op.ticketPrice}`}</span>
                        </div>
                        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem', lineHeight: 1.1 }}>{op.title}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '1.1rem', fontWeight: '500' }}>
                            <span>📅 {eventDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                            <span>⏰ {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>📍 {op.locationType === 'Online' ? 'Online' : op.location}</span>
                        </div>
                    </div>
                </div>

                <div className="container" style={{ maxWidth: '1100px', padding: '3rem 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: '4rem' }}>

                    {/* LEFT COL */}
                    <div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>About this Event</h3>
                        <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-body)', whiteSpace: 'pre-line', marginBottom: '3rem' }}>
                            {op.description}
                        </div>

                        {op.speakers && op.speakers.length > 0 && (
                            <div style={{ marginBottom: '3rem' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Speakers</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    {op.speakers.map((s, i) => (
                                        <div key={i} style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', background: '#f9fafb' }}>
                                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e5e7eb', margin: '0 auto 1rem', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎤</div>
                                            <h4 style={{ fontWeight: 'bold' }}>{s.name}</h4>
                                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{s.role}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL (Sidebar) */}
                    <div>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', position: 'sticky', top: '24px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Organized By</p>
                                <h4 style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{op.organizer} {companyDetails?.isVerified && '✔'}</h4>
                            </div>

                            {hasApplied ? (
                                <button disabled className="btn btn-secondary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', cursor: 'default', background: '#ecfdf5', color: '#047857' }}>✅ You are Registered!</button>
                            ) : (
                                <button onClick={() => {
                                    if (op.applicationMethod === 'external') {
                                        setShowExternalModal(true);
                                    } else {
                                        setShowModal(true);
                                    }
                                }} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginBottom: '1rem' }}>
                                    {op.applicationMethod === 'external' ? 'Register on External Site ↗' : (op.registrationType === 'Free' ? 'Register for Free' : `Get Ticket • ${op.salaryCurrency || 'RWF'} ${op.ticketPrice}`)}
                                </button>
                            )}

                            {/* Location Map Placeholder */}
                            <div style={{ marginTop: '2rem', height: '150px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                                {op.locationType === 'Online' ? '🌐 Online Event Link' : '🗺️ Map View'}
                            </div>
                        </div>
                    </div>
                </div>

                {showModal && renderApplicationModal()}
                {showExternalModal && renderExternalApplyModal()}
            </div>
        )
    }

    return (
        <div className="container" style={{ padding: '4rem 24px', maxWidth: '900px', position: 'relative' }}>

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/opportunities" style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem', display: 'inline-block' }}>&larr; Back to Opportunities</Link>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', overflow: 'hidden' }}>
                        {companyDetails?.logo ? <img src={companyDetails.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (op.type === 'job' ? '💼' : op.type === 'event' ? '📅' : op.type === 'gig' ? '⚡' : '🎓')}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ marginBottom: '0.5rem', fontSize: '2.2rem', lineHeight: '1.2' }}>{op.title}</h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-body)' }}>
                            {op.type === 'event' ? 'Organized by ' : 'at '}
                            <Link to={op.companyId === 'admin-manual' ? '#' : `/companies/${op.companyId}`} style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                {op.type === 'event' ? op.organizer : op.company}
                            </Link>
                            {companyDetails?.isVerified && <span title="Verified" style={{ marginLeft: '6px', color: '#0ea5e9' }}>✔</span>}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}>
                    <span className={`tag tag-${op.type}`} style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>{(op.type || 'job').toUpperCase()}</span>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>📍 {op.location}</span>
                    {op.locationType && <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{op.locationType}</span>}
                    {op.employmentType && <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{op.employmentType}</span>}
                    {op.isFeatured && <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>⭐ Featured</span>}
                </div>
            </div>

            {/* KEY DETAILS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem', background: '#F9FAFB', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                {/* Common Deadline */}
                {op.deadline && op.type !== 'event' && (
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Deadline</p>
                        <p style={{ fontWeight: '600' }}>{new Date(op.deadline).toLocaleDateString()}</p>
                    </div>
                )}
                {/* Job Specific */}
                {(op.type === 'job' || op.type === 'contract') && (
                    <>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Salary</p>
                            <p style={{ fontWeight: '600', color: '#059669' }}>{op.salaryRange || 'Competitive'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Level</p>
                            <p style={{ fontWeight: '600' }}>{op.experienceLevel || 'Entry'}</p>
                        </div>
                        {op.category && (
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Category</p>
                                <p style={{ fontWeight: '600' }}>{op.category}</p>
                            </div>
                        )}
                    </>
                )}
                {/* Keep Internship/Gig/Event logic from previous ... */}
                {op.type === 'internship' && (
                    <>
                        <div><p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Duration</p><p style={{ fontWeight: '600' }}>{op.duration}</p></div>
                        <div><p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Compensation</p><p style={{ fontWeight: '600' }}>{op.stipend || 'Unpaid'}</p></div>
                    </>
                )}
                {op.type === 'gig' && (
                    <>
                        <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
                            <p style={{ fontSize: '0.8rem', color: '#047857', textTransform: 'uppercase', fontWeight: 'bold' }}>💰 Budget</p>
                            <p style={{ fontWeight: '800', color: '#065f46', fontSize: '1.25rem' }}>{op.budget || 'Negotiable'}</p>
                        </div>
                        <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '8px', border: '1px solid #fdba74' }}>
                            <p style={{ fontSize: '0.8rem', color: '#c2410c', textTransform: 'uppercase', fontWeight: 'bold' }}>📦 Deliverables</p>
                            <p style={{ fontWeight: '600', color: '#9a3412' }}>{op.deliverables || 'See Description'}</p>
                        </div>
                    </>
                )}
                {op.type === 'event' && (
                    <>
                        <div><p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Starts</p><p style={{ fontWeight: '600' }}>{op.startDate ? new Date(op.startDate).toLocaleString() : 'TBA'}</p></div>
                        <div><p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Ends</p><p style={{ fontWeight: '600' }}>{op.endDate ? new Date(op.endDate).toLocaleString() : 'TBA'}</p></div>
                    </>
                )}
                {op.type === 'part-time' && (
                    <>
                        <div><p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Schedule</p><p style={{ fontWeight: '600', color: '#4338ca' }}>{op.scheduleType || op.schedule}</p></div>
                        <div><p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Hours</p><p style={{ fontWeight: '600' }}>{op.hoursPerWeek}</p></div>
                        <div><p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Pay</p><p style={{ fontWeight: '600', color: '#059669' }}>{op.salaryRange}</p></div>
                    </>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
                {/* ... (Existing Apply Logic) ... */}
                {hasApplied ? (
                    <button disabled className="btn btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', cursor: 'default', background: '#DEF7EC', color: '#03543F' }}>{op.type === 'event' ? '✅ Registered' : '✅ Application Sent'}</button>
                ) : (
                    <button onClick={() => {
                        // Guest Apply Allowed
                        if (op.applicationMethod === 'external') {
                            setShowExternalModal(true);
                        } else {
                            setShowModal(true);
                        }
                    }} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>{getCTA(op.type)}</button>
                )}
                <button onClick={toggleBookmark} className="btn btn-outline" style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem', backgroundColor: isSaved ? '#fef3c7' : 'white', borderColor: isSaved ? '#f59e0b' : 'var(--border)', color: isSaved ? '#b45309' : 'inherit', cursor: 'pointer' }}>{isSaved ? 'Saved ⭐' : 'Save'}</button>
            </div>

            {/* DEEP VIEW CONTENT */}
            <div style={{ marginBottom: '4rem' }}>
                <h3 style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>About this {op.type === 'event' ? 'Event' : 'Role'}</h3>
                <div style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-body)', whiteSpace: 'pre-line', marginBottom: '2rem' }}>
                    {op.description}
                </div>

                {/* Responsibilities */}
                {op.responsibilities && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Key Responsibilities</h4>
                        <div style={{ lineHeight: '1.7', whiteSpace: 'pre-line', color: 'var(--text-body)' }}>{op.responsibilities}</div>
                    </div>
                )}

                {/* Requirements */}
                {op.requirements && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Requirements</h4>
                        <div style={{ lineHeight: '1.7', whiteSpace: 'pre-line', color: 'var(--text-body)' }}>{op.requirements}</div>
                    </div>
                )}

                {/* Benefits */}
                {op.benefits && op.benefits.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Benefits & Perks</h4>
                        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                            {op.benefits.map((b, i) => (
                                <span key={i} style={{ padding: '0.5rem 1rem', background: '#F3F4F6', borderRadius: '30px', fontSize: '0.9rem', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    ✨ {b}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Internship Learning Outcomes */}
                {op.type === 'internship' && op.learningOutcomes && (
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#EFF6FF', borderRadius: '8px' }}>
                        <h4 style={{ color: '#1E40AF', marginBottom: '0.5rem' }}>🎓 What you will learn</h4>
                        <p>{op.learningOutcomes}</p>
                    </div>
                )}
            </div>

            {/* Part-Time Work Schedule Section */}
            {op.type === 'part-time' && op.scheduleType && (
                <div style={{ marginBottom: '4rem', padding: '1.5rem', background: '#e0e7ff', borderRadius: '12px', border: '1px solid #c7d2fe' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#3730a3' }}>📅 Work Schedule</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: '#4338ca', fontWeight: '600' }}>Shift Type</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#312e81' }}>{op.scheduleType}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: '#4338ca', fontWeight: '600' }}>Hours / Week</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#312e81' }}>{op.hoursPerWeek}</p>
                        </div>
                        {op.schedule && (
                            <div>
                                <p style={{ fontSize: '0.9rem', color: '#4338ca', fontWeight: '600' }}>Specifics</p>
                                <p style={{ fontSize: '1rem', color: '#312e81' }}>{op.schedule}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* About Company Section (if available) */}
            {companyDetails && (
                <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>About {op.company}</h3>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-body)' }}>{companyDetails.description || 'No description provided.'}</p>

                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
                        {companyDetails.website && <a href={companyDetails.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: '500' }}>🌐 Website</a>}
                        {/* Other social links could go here if we had them */}
                    </div>
                </div>
            )}


            {/* MODAL */}
            {showModal && renderApplicationModal()}
            {showExternalModal && renderExternalApplyModal()}

        </div>
    );
};

export default OpportunityDetailsPage;
