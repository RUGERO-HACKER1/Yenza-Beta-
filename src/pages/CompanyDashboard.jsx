import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const CompanyDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [ops, setOps] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch Opportunities
                const opsRes = await fetch('http://localhost:5000/opportunities');
                const opsData = await opsRes.json();
                const myOps = opsData.filter(op => op.companyId === user.id);
                setOps(myOps);

                // 2. Fetch All Applications (then filter by myOps IDs)
                const appsRes = await fetch('http://localhost:5000/applications');
                const appsData = await appsRes.json();

                const myOpsIds = new Set(myOps.map(o => o.id));
                const myApps = appsData.filter(a => myOpsIds.has(a.opportunityId));
                setApplications(myApps);

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, [user, navigate]);

    const handleAppStatus = async (appId, newStatus, userId, appTitle) => {
        // Optimistic UI
        const updatedApps = applications.map(a => a.id === appId ? { ...a, status: newStatus } : a);
        setApplications(updatedApps);

        // 1. Update Application Status
        await fetch(`http://localhost:5000/applications/${appId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        // 2. Notify Applicant
        await fetch('http://localhost:5000/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                message: `Your application for ${appTitle} has been ${newStatus.toUpperCase()}.`,
                type: newStatus === 'shortlisted' ? 'success' : 'warning',
                relatedId: appId
            })
        });
    };

    if (!user) return null;
    if (loading) return <div className="container" style={{ padding: '4rem' }}>Loading...</div>;

    const pendingCount = ops.filter(o => o.status === 'pending').length;
    const activeCount = ops.filter(o => o.status === 'approved').length;

    return (
        <div className="container" style={{ padding: '4rem 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {user.name}</h1>
                    <p style={{ color: 'var(--text-light)' }}>Manage your opportunities & applications</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/pricing" className="btn btn-outline" style={{ borderColor: '#f59e0b', color: '#b45309' }}>💎 Upgrade Plan</Link>
                    <Link to="/post" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '30px', fontWeight: 'bold' }}>
                        + Post Opportunity
                    </Link>
                    <Link to="/contact" className="btn btn-outline" style={{ display: 'inline-block', padding: '0.8rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', marginLeft: '1rem', border: '1px solid #D1D5DB', textDecoration: 'none', color: '#374151' }}>
                        💬 Support
                    </Link>
                </div>
            </div>
            {/* Stats */}
            <div className="grid grid-3" style={{ marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{activeCount}</h3>
                    <p style={{ color: 'var(--text-body)' }}>Active Posts</p>
                </div>
                <div style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '2rem', color: '#F59E0B' }}>{pendingCount}</h3>
                    <p style={{ color: 'var(--text-body)' }}>Pending Approval</p>
                </div>
                <div style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>{applications.length}</h3>
                    <p style={{ color: 'var(--text-body)' }}>Total Applicants</p>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Left: Your Posts */}
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Your Posts</h2>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-input)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Title</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Promote</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ops.map(op => (
                                    <tr key={op.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <Link to={`/opportunities/${op.id}`} style={{ fontWeight: '500' }}>{op.title}</Link>
                                            <br /><span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{applications.filter(a => a.opportunityId === op.id).length} applicants</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {op.isFeatured && <span style={{ display: 'block', fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'bold', marginBottom: '2px' }}>FEATURED</span>}
                                            <span style={{
                                                padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                                backgroundColor: op.status === 'approved' ? '#dcfce7' : op.status === 'in_progress' ? '#dbeafe' : op.status === 'completed' ? '#d1d5db' : op.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                                color: op.status === 'approved' ? '#166534' : op.status === 'in_progress' ? '#1e40af' : op.status === 'completed' ? '#374151' : op.status === 'rejected' ? '#991b1b' : '#92400e'
                                            }}>
                                                {op.status.toUpperCase().replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {!op.isFeatured && op.status === 'approved' && (
                                                <Link to="/pricing" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>Boost 🚀</Link>
                                            )}
                                            {op.type === 'gig' && op.status === 'in_progress' && (
                                                <button
                                                    onClick={async () => {
                                                        if (!window.confirm("Mark this gig as completed? Ensure payment is settled.")) return;
                                                        await fetch(`http://localhost:5000/opportunities/${op.id}`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ status: 'completed' })
                                                        });
                                                        setOps(ops.map(o => o.id === op.id ? { ...o, status: 'completed' } : o));
                                                    }}
                                                    style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 'bold', background: 'none', border: '1px solid #059669', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    ✅ Mark Done
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Recent Applications */}
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Recent Applications</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {applications.length === 0 && <p style={{ color: 'var(--text-light)' }}>No applications yet.</p>}
                        {applications.map(app => {
                            const op = ops.find(o => o.id === app.opportunityId);
                            return (
                                <div key={app.id} style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0 }}>{app.fullName}</h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{new Date(app.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', marginBottom: '0.5rem' }}>
                                        Applied for <span style={{ fontWeight: '500' }}>{op ? op.title : 'Unknown'}</span>
                                    </p>
                                    {app.cvLink && <a href={app.cvLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>View CV/Portfolio</a>}
                                    {app.offerAmount && (
                                        <div style={{ marginTop: '0.2rem', color: '#059669', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                            ⚡ Bid Offer: {app.offerAmount}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {app.status === 'accepted' ? (
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#15803d' }}>
                                            ✅ HIRED / ACCEPTED
                                        </div>
                                    ) : app.status === 'applied' || app.status === 'shortlisted' ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {(op?.type === 'gig') ? (
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm(`Accept proposal from ${app.fullName}? This will mark the Gig as In Progress.`)) return;

                                                        // 1. Update App Status
                                                        await handleAppStatus(app.id, 'accepted', app.userId, op.title);

                                                        // 2. Update Gig Status
                                                        await fetch(`http://localhost:5000/opportunities/${op.id}`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ status: 'in_progress' })
                                                        });

                                                        // Update Local State
                                                        setOps(ops.map(o => o.id === op.id ? { ...o, status: 'in_progress' } : o));
                                                        setApplications(applications.map(a => a.id === app.id ? { ...a, status: 'accepted' } : a));
                                                    }}
                                                    style={{ flex: 1, padding: '0.3rem 0.8rem', fontSize: '0.8rem', background: '#1e40af', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                                >
                                                    Accept Proposal ⚡
                                                </button>
                                            ) : (
                                                <button onClick={() => handleAppStatus(app.id, 'shortlisted', app.userId, op ? op.title : 'Opportunity')} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', background: '#dcfce7', color: '#166534', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Shortlist</button>
                                            )}
                                            <button onClick={() => handleAppStatus(app.id, 'rejected', app.userId, op ? op.title : 'Opportunity')} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Reject</button>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.5rem', color: app.status === 'shortlisted' ? '#166534' : '#991b1b' }}>
                                            Status: {app.status.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CompanyDashboard;
