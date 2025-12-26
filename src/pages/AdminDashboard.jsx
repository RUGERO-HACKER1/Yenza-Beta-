import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: 0,
        companies: 0,
        opsTotal: 0,
        opsPending: 0,
        opsApproved: 0,
        opsFeatured: 0,
        appsTotal: 0
    });
    const [ops, setOps] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [messages, setMessages] = useState([]);

    const fetchData = async () => {
        try {
            // Helper to safely fetch JSON
            const safeFetch = async (url) => {
                try {
                    const res = await fetch(url);
                    if (!res.ok) return [];
                    return await res.json();
                } catch (e) {
                    console.warn(`Failed to fetch ${url}`, e);
                    return [];
                }
            };

            const [statsData, opsData, compsData, usersData, appsData, msgsData] = await Promise.all([
                safeFetch('http://localhost:5000/stats'),
                safeFetch('http://localhost:5000/admin/opportunities'),
                safeFetch('http://localhost:5000/companies'),
                safeFetch('http://localhost:5000/users'),
                safeFetch('http://localhost:5000/admin/applications'),
                safeFetch('http://localhost:5000/admin/messages')
            ]);

            setStats({
                ...statsData, // If stats fails, this might spread empty array/obj, handle carefully
                users: usersData.length || statsData.users || 0,
                companies: compsData.length || statsData.companies || 0,
                opsTotal: opsData.length || statsData.opportunities || 0,
                opsPending: opsData.filter(o => o.status === 'pending').length,
                opsApproved: opsData.filter(o => o.status === 'approved').length,
                opsFeatured: opsData.filter(o => o.isFeatured).length,
                appsTotal: appsData.length || statsData.applications || 0,
                msgsUnread: msgsData.filter(m => !m.read).length
            });
            setOps(opsData);
            setCompanies(compsData);
            setUsers(usersData);
            setApplications(appsData);
            setMessages(msgsData);
        } catch (err) {
            console.error("Error fetching admin data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/user/login');
        } else if (user.role !== 'admin') {
            navigate('/');
        } else {
            fetchData();
        }
    }, [user, navigate]);
    // ... (existing)
    const handleAppAction = async (id, status) => {
        try {
            await fetch(`http://localhost:5000/admin/applications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCompanyAction = async (id, action) => {
        const { check, rejectionReason } = action;
        try {
            const res = await fetch(`http://localhost:5000/admin/companies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ check, rejectionReason })
            });
            if (res.ok) {
                const updatedComp = await res.json();
                setCompanies(prev => prev.map(c => c.id === id ? updatedComp : c));
                // Refresh stats
                setStats(prev => ({
                    ...prev,
                    companies: updatedComp.isVerified ? prev.companies : prev.companies // Count usually stable unless filtering
                    // Actually verification changes count if we filtered by verified.
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const [activeTab, setActiveTab] = useState('overview');

    const handleOpAction = async (id, action) => {
        // action: 'approve', 'reject', 'feature', 'unfeature'
        let updates = {};
        if (action === 'approve') updates = { status: 'approved' };
        if (action === 'reject') updates = { status: 'rejected' };
        if (action === 'feature') updates = { isFeatured: true };
        if (action === 'unfeature') updates = { isFeatured: false };

        try {
            await fetch(`http://localhost:5000/admin/opportunities/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            // Refresh local state
            setOps(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
            // Trigger refresh to update stats cards
            const updatedOps = ops.map(o => o.id === id ? { ...o, ...updates } : o);
            setStats(prev => ({
                ...prev,
                opsPending: updatedOps.filter(o => o.status === 'pending').length,
                opsApproved: updatedOps.filter(o => o.status === 'approved').length,
                opsFeatured: updatedOps.filter(o => o.isFeatured).length
            }));

        } catch (err) {
            console.error("Action error", err);
        }
    };

    const handleDeleteOp = async (id) => {
        if (!window.confirm("Are you sure you want to delete this opportunity? This cannot be undone.")) return;
        try {
            await fetch(`http://localhost:5000/admin/opportunities/${id}`, { method: 'DELETE' });
            setOps(prev => prev.filter(o => o.id !== id));
            setStats(prev => ({
                ...prev,
                opsTotal: prev.opsTotal - 1,
                opsPending: ops.find(o => o.id === id)?.status === 'pending' ? prev.opsPending - 1 : prev.opsPending,
                opsApproved: ops.find(o => o.id === id)?.status === 'approved' ? prev.opsApproved - 1 : prev.opsApproved
            }));
        } catch (err) {
            console.error(err);
        }
    };

    // Post Op State
    const [newOp, setNewOp] = useState({ title: '', company: '', type: 'job', location: '', description: '', applyLink: '', deadline: '', tagsString: '' });

    const handlePostOp = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newOp,
                    status: 'approved', // Admin posts are auto-approved
                    companyId: 'admin-manual',
                    tags: newOp.tagsString.split(',').map(t => t.trim())
                })
            });
            if (res.ok) {
                alert("Opportunity Posted Successfully!");
                setNewOp({ title: '', company: '', type: 'job', location: '', description: '', applyLink: '', deadline: '', tagsString: '' });
                fetchData(); // Refresh list
                setActiveTab('ops');
            }
        } catch (err) {
            alert("Error posting opportunity");
        }
    };

    // Prepare Chart Data
    const typeData = [
        { name: 'Job', value: ops.filter(o => o.type === 'job').length },
        { name: 'Internship', value: ops.filter(o => o.type === 'internship').length },
        { name: 'Event', value: ops.filter(o => o.type === 'event').length },
        { name: 'Training', value: ops.filter(o => o.type === 'training').length },
        { name: 'Gig', value: ops.filter(o => o.type === 'gig').length }
    ].filter(d => d.value > 0);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) return <div className="container" style={{ padding: '4rem' }}>Loading Admin Panel...</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
            {/* Admin Header */}
            <header style={{ background: '#111827', color: 'white', padding: '1rem 0' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to="/" style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', textDecoration: 'none' }}>YENZA <span style={{ color: '#F59E0B', fontSize: '0.8rem' }}>ADMIN</span></Link>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => fetchData()} style={{ background: 'transparent', border: '1px solid #374151', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>↻ Refresh</button>
                        <button onClick={logout} style={{ background: '#DC2626', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
                    </div>
                </div>
            </header>

            <div className="container" style={{ flex: 1, padding: '2rem 0', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>

                {/* Sidebar */}
                <aside>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            style={{
                                textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: activeTab === 'overview' ? '#EEF2FF' : 'transparent',
                                color: activeTab === 'overview' ? '#4F46E5' : '#374151',
                                fontWeight: activeTab === 'overview' ? '600' : '400'
                            }}>
                            📊 Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('ops')}
                            style={{
                                textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: activeTab === 'ops' ? '#EEF2FF' : 'transparent',
                                color: activeTab === 'ops' ? '#4F46E5' : '#374151',
                                fontWeight: activeTab === 'ops' ? '600' : '400'
                            }}>
                            💼 Opportunities
                            {stats.opsPending > 0 && <span style={{ marginLeft: 'auto', background: '#F59E0B', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', float: 'right' }}>{stats.opsPending}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('companies')}
                            style={{
                                textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: activeTab === 'companies' ? '#EEF2FF' : 'transparent',
                                color: activeTab === 'companies' ? '#4F46E5' : '#374151',
                                fontWeight: activeTab === 'companies' ? '600' : '400'
                            }}>
                            🏢 Companies
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            style={{
                                textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: activeTab === 'users' ? '#EEF2FF' : 'transparent',
                                color: activeTab === 'users' ? '#4F46E5' : '#374151',
                                fontWeight: activeTab === 'users' ? '600' : '400'
                            }}>
                            👥 Users
                        </button>
                        <button
                            onClick={() => setActiveTab('apps')}
                            style={{
                                textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: activeTab === 'apps' ? '#EEF2FF' : 'transparent',
                                color: activeTab === 'apps' ? '#4F46E5' : '#374151',
                                fontWeight: activeTab === 'apps' ? '600' : '400'
                            }}>
                            📝 Applications
                            {applications.filter(a => a.status === 'applied').length > 0 && <span style={{ marginLeft: 'auto', background: '#F59E0B', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', float: 'right' }}>{applications.filter(a => a.status === 'applied').length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('messages')}
                            style={{
                                textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: activeTab === 'messages' ? '#EEF2FF' : 'transparent',
                                color: activeTab === 'messages' ? '#4F46E5' : '#374151',
                                fontWeight: activeTab === 'messages' ? '600' : '400'
                            }}>
                            💬 Inquiries
                            {messages.filter(m => !m.read).length > 0 && <span style={{ marginLeft: 'auto', background: '#F59E0B', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', float: 'right' }}>{messages.filter(m => !m.read).length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('admin-posts')}
                            style={{
                                textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: activeTab === 'admin-posts' ? '#EEF2FF' : 'transparent',
                                color: activeTab === 'admin-posts' ? '#4F46E5' : '#374151',
                                fontWeight: activeTab === 'admin-posts' ? '600' : '400'
                            }}>
                            ⚡ Your Posts
                        </button>
                        <Link to="/post" style={{ textDecoration: 'none' }}>
                            <button
                                style={{
                                    textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                    background: '#2563EB', color: 'white', fontWeight: 'bold', width: '100%',
                                    marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}>
                                ➕ Post New Opportunity
                            </button>
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main>
                    {activeTab === 'overview' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem' }}>Dashboard Overview</h2>
                            <div className="grid grid-3" style={{ gap: '1.5rem', marginBottom: '3rem' }}>
                                <StatCard label="Total Users" value={stats.users} color="blue" />
                                <StatCard label="Total Companies" value={stats.companies} color="purple" />
                                <StatCard label="Live Opportunities" value={stats.opsApproved} color="green" />
                                <StatCard label="Pending Approval" value={stats.opsPending} color="yellow" />
                                <StatCard label="Featured Items" value={stats.opsFeatured} color="gold" />
                            </div>

                            {/* Analytics Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                {/* Opportunities by Type */}
                                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Opportunities by Type</h3>
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={typeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label
                                                >
                                                    {typeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Placeholder for Applications Trend */}
                                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Application Activity</h3>
                                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', color: '#6b7280', flexDirection: 'column' }}>
                                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>coming soon</p>
                                        <span style={{ fontSize: '0.9rem' }}>Application trends over time</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ops' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem' }}>Manage Opportunities</h2>

                            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Title / Company</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Featured</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ops.sort((a, b) => (a.status === 'pending' ? -1 : 1)).map(op => {
                                            const company = companies.find(c => c.id === op.companyId) || companies.find(c => c.name === op.company); // Fallback to name if ID missing
                                            return (
                                                <tr key={op.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {op.title}
                                                            <a href={`/opportunities/${op.id}`} target="_blank" rel="noreferrer" title="View Public Page" style={{ fontSize: '0.8rem', textDecoration: 'none' }}>🔗</a>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {op.company}
                                                            {company?.isVerified && <span title="Verified Company" style={{ color: '#0ea5e9' }}>✔</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span className={`tag tag-${op.type}`} style={{ fontSize: '0.75rem' }}>{op.type}</span>
                                                        {op.salaryRange && <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#059669' }}>{op.salaryRange}</div>}
                                                        {op.budget && <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#059669' }}>{op.budget}</div>}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                                            backgroundColor: op.status === 'approved' ? '#dcfce7' : op.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                                            color: op.status === 'approved' ? '#166534' : op.status === 'rejected' ? '#991b1b' : '#92400e'
                                                        }}>
                                                            {op.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {op.isFeatured ? '⭐ Yes' : '-'}
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        {/* Existing Actions */}
                                                        {op.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => handleOpAction(op.id, 'approve')} style={{ padding: '0.3rem 0.6rem', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                                                                <button onClick={() => handleOpAction(op.id, 'reject')} style={{ padding: '0.3rem 0.6rem', background: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                                                            </>
                                                        )}
                                                        {op.status === 'approved' && !op.isFeatured && (
                                                            <button onClick={() => handleOpAction(op.id, 'feature')} style={{ padding: '0.3rem 0.6rem', background: '#F59E0B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Feature</button>
                                                        )}
                                                        {op.isFeatured && (
                                                            <button onClick={() => handleOpAction(op.id, 'unfeature')} style={{ padding: '0.3rem 0.6rem', background: '#4B5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Unfeature</button>
                                                        )}
                                                        <button onClick={() => setActiveTab('apps')} title="View Applications" style={{ padding: '0.3rem 0.6rem', background: '#2563EB', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '0.5rem' }}>📝</button>
                                                        <button onClick={() => handleDeleteOp(op.id)} title="Delete" style={{ padding: '0.3rem 0.6rem', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '0.5rem' }}>🗑️</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'post-op' && (
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '800px' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Post New Opportunity</h2>
                            <form onSubmit={handlePostOp} style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Opportunity Title</label>
                                        <input className="input" value={newOp.title} onChange={e => setNewOp({ ...newOp, title: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Company Name (Manual)</label>
                                        <input className="input" value={newOp.company} onChange={e => setNewOp({ ...newOp, company: e.target.value })} required placeholder="e.g. UNICEF, Google, etc." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Type</label>
                                        <select value={newOp.type} onChange={e => setNewOp({ ...newOp, type: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                            <option value="job">Job</option>
                                            <option value="internship">Internship</option>
                                            <option value="part-time">Part-Time</option>
                                            <option value="training">Training</option>
                                            <option value="event">Event</option>
                                            <option value="gig">Gig / Micro-task</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location</label>
                                        <input className="input" value={newOp.location} onChange={e => setNewOp({ ...newOp, location: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                                    <textarea value={newOp.description} onChange={e => setNewOp({ ...newOp, description: e.target.value })} required rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}></textarea>
                                </div>

                                {newOp.type === 'event' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date & Time</label>
                                            <input type="datetime-local" className="input" value={newOp.startDate || ''} onChange={e => setNewOp({ ...newOp, startDate: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date & Time</label>
                                            <input type="datetime-local" className="input" value={newOp.endDate || ''} onChange={e => setNewOp({ ...newOp, endDate: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Application Link</label>
                                            <input type="url" className="input" value={newOp.applyLink || ''} onChange={e => setNewOp({ ...newOp, applyLink: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Deadline</label>
                                            <input type="date" className="input" value={newOp.deadline || ''} onChange={e => setNewOp({ ...newOp, deadline: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tags (Comma separated)</label>
                                    <input className="input" value={newOp.tagsString || ''} onChange={e => setNewOp({ ...newOp, tagsString: e.target.value })} placeholder="e.g. Remote, Paid, Urgent" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '0.5rem' }} />
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                                        {['Remote', 'Paid', 'Part-time', 'Full-time'].map(tag => (
                                            <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={(newOp.tagsString || '').includes(tag)}
                                                    onChange={(e) => {
                                                        const currentTags = (newOp.tagsString || '').split(',').map(t => t.trim()).filter(Boolean);
                                                        let newTags;
                                                        if (e.target.checked) {
                                                            newTags = [...currentTags, tag];
                                                        } else {
                                                            newTags = currentTags.filter(t => t !== tag);
                                                        }
                                                        setNewOp({ ...newOp, tagsString: newTags.join(', ') });
                                                    }}
                                                />
                                                {tag}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold' }}>Post Opportunity</button>
                            </form>
                        </div>
                    )}

                    {
                        activeTab === 'companies' && (
                            <div>
                                <h2 style={{ marginBottom: '1.5rem' }}>Manage Companies</h2>
                                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead style={{ background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                                            <tr>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Company</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Contact / Doc</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {companies.sort((a, b) => (a.check === 'pending' ? -1 : 1)).map(comp => (
                                                <tr key={comp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{comp.name}</div>
                                                        {comp.website && <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{comp.website}</div>}
                                                        {comp.address && <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{comp.address}</div>}
                                                    </td>
                                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                                        <div>{comp.email}</div>
                                                        {comp.phone && <div>{comp.phone}</div>}
                                                        {comp.documentUrl && (
                                                            <a
                                                                href={`http://localhost:5000${comp.documentUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ color: '#2563EB', textDecoration: 'underline', marginTop: '0.2rem', display: 'inline-block' }}
                                                            >
                                                                View Document
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                                            backgroundColor: comp.check === 'approved' ? '#dcfce7' : comp.check === 'rejected' ? '#fee2e2' : '#fef3c7',
                                                            color: comp.check === 'approved' ? '#166534' : comp.check === 'rejected' ? '#991b1b' : '#92400e'
                                                        }}>
                                                            {(comp.check || 'pending').toUpperCase()}
                                                        </span>
                                                        {comp.check === 'rejected' && comp.rejectionReason && (
                                                            <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '4px' }}>
                                                                Reason: {comp.rejectionReason}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        {comp.check !== 'approved' && (
                                                            <button onClick={() => handleCompanyAction(comp.id, 'approve')} style={{ padding: '0.3rem 0.6rem', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                                                        )}
                                                        {comp.check !== 'rejected' && (
                                                            <button onClick={() => handleCompanyAction(comp.id, 'reject')} style={{ padding: '0.3rem 0.6rem', background: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    }

                    {
                        activeTab === 'users' && (
                            <div>
                                <h2 style={{ marginBottom: '1.5rem' }}>Registered Users</h2>
                                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead style={{ background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                                            <tr>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Onboarding</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Education</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{u.name || '-'}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-light)' }}>{u.email}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span className={`tag tag-${u.role === 'admin' ? 'job' : 'gig'}`} style={{ textTransform: 'capitalize' }}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {u.isProfileComplete
                                                            ? <span style={{ color: '#059669', fontSize: '0.9rem' }}>✔ Complete</span>
                                                            : <span style={{ color: '#F59E0B', fontSize: '0.9rem' }}>Incomplete</span>
                                                        }
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-light)' }}>{u.education || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    }

                    {activeTab === 'apps' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem' }}>Review Applications</h2>
                            {/* ... (existing apps view) ... */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {applications.length === 0 && <p style={{ color: 'var(--text-light)' }}>No applications found.</p>}
                                {applications.map(app => {
                                    const op = ops.find(o => o.id === app.opportunityId);
                                    const isManual = op?.companyId === 'admin-manual'; // Legacy check
                                    return (
                                        <div key={app.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <h4 style={{ margin: 0 }}>{app.fullName}</h4>
                                                    {isManual && <span style={{ fontSize: '0.7rem', background: '#EEF2FF', color: '#4F46E5', padding: '2px 6px', borderRadius: '4px' }}>Admin Post</span>}
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>
                                                    Applied for: <strong>{op ? op.title : 'Unknown'}</strong> ({op?.company})
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                                                    {app.email} • {new Date(app.submittedAt).toLocaleDateString()}
                                                </div>
                                                {app.cvLink && <a href={app.cvLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'inline-block', marginTop: '0.5rem' }}>View CV/Portfolio</a>}
                                                {app.offerAmount && (
                                                    <div style={{ marginTop: '0.4rem', color: '#059669', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                        ⚡ Bid Offer: {app.offerAmount}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                {app.status === 'applied' ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => handleAppAction(app.id, 'shortlisted')} style={{ padding: '0.5rem 1rem', background: '#059669', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Shortlist</button>
                                                        <button onClick={() => handleAppAction(app.id, 'rejected')} style={{ padding: '0.5rem 1rem', background: '#DC2626', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                                                    </div>
                                                ) : (
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold',
                                                        backgroundColor: app.status === 'shortlisted' ? '#dcfce7' : '#fee2e2',
                                                        color: app.status === 'shortlisted' ? '#166534' : '#991b1b'
                                                    }}>
                                                        {app.status.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem' }}>Support Inquiries</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {messages.length === 0 ? (
                                    <p style={{ color: '#6B7280' }}>No messages yet.</p>
                                ) : (
                                    messages.map(msg => (
                                        <div key={msg.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <h4 style={{ fontSize: '1.1rem', color: '#1F2937', margin: 0 }}>{msg.subject}</h4>
                                                <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>{new Date(msg.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#6B7280', marginBottom: '1rem' }}>
                                                <span>👤 {msg.name}</span>
                                                <span>✉️ {msg.email}</span>
                                            </div>
                                            <p style={{ color: '#374151', lineHeight: '1.6', background: '#F9FAFB', padding: '1rem', borderRadius: '8px' }}>
                                                {msg.message}
                                            </p>
                                            <div style={{ marginTop: '1rem' }}>
                                                <a href={`mailto:${msg.email}`} className="btn btn-outline" style={{ display: 'inline-block', fontSize: '0.85rem', padding: '0.4rem 1rem', border: '1px solid #D1D5DB', borderRadius: '6px', textDecoration: 'none', color: '#374151' }}>Reply via Email</a>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'admin-posts' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem' }}>Your Posts (Admin)</h2>
                            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'var(--bg-input)' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Title</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Applicants</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ops.filter(o => o.companyId === user.id).length === 0 && (
                                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>You haven't posted any opportunities yet.</td></tr>
                                        )}
                                        {ops.filter(o => o.companyId === user.id).map(op => {
                                            const myApps = applications.filter(a => a.opportunityId === op.id);
                                            return (
                                                <tr key={op.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <Link to={`/opportunities/${op.id}`} style={{ fontWeight: '500', color: 'var(--primary)' }}>{op.title}</Link>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{op.company}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                                            backgroundColor: op.status === 'approved' ? '#dcfce7' : op.status === 'in_progress' ? '#dbeafe' : op.status === 'completed' ? '#d1d5db' : '#fef3c7',
                                                            color: op.status === 'approved' ? '#166534' : op.status === 'in_progress' ? '#1e40af' : op.status === 'completed' ? '#374151' : '#92400e'
                                                        }}>
                                                            {op.status.toUpperCase().replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ fontSize: '0.9rem' }}>{myApps.length} Applicants</span>
                                                        {myApps.length > 0 && <button onClick={() => setActiveTab('apps')} style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>View</button>}
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                        {op.type === 'gig' && op.status === 'in_progress' && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (!window.confirm("Mark as completed?")) return;
                                                                    await fetch(`http://localhost:5000/admin/opportunities/${op.id}`, {
                                                                        method: 'PATCH',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ status: 'completed' })
                                                                    });
                                                                    // Refresh
                                                                    setOps(ops.map(o => o.id === op.id ? { ...o, status: 'completed' } : o));
                                                                }}
                                                                style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 'bold', background: 'none', border: '1px solid #059669', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                            >
                                                                ✅ Mark Done
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDeleteOp(op.id)} style={{ marginLeft: '1rem', fontSize: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main >
            </div >
        </div >
    );
};

// Helper Component
const StatCard = ({ label, value, color }) => {
    let bg = 'white';
    let text = 'var(--text-main)';
    if (color === 'blue') text = '#2563EB';
    if (color === 'purple') text = '#7C3AED';
    if (color === 'green') text = '#059669';
    if (color === 'yellow') text = '#D97706';
    if (color === 'gold') text = '#F59E0B';

    return (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>{label}</p>
            <h3 style={{ fontSize: '2rem', margin: 0, color: text }}>{value}</h3>
        </div>
    );
};

export default AdminDashboard;
