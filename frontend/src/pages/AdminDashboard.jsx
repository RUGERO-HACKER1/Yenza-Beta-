import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Data States
    const [stats, setStats] = useState({
        users: 0, companies: 0, opsTotal: 0, opsPending: 0, opsApproved: 0, opsFeatured: 0, appsTotal: 0
    });
    const [ops, setOps] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [messages, setMessages] = useState([]);
    const [analytics, setAnalytics] = useState({
        totalVisitors: 0, topPages: [], sources: [], geo: [], devices: [], dailyTraffic: []
    });

    // New Opportunity State
    const [newOp, setNewOp] = useState({
        title: '', company: '', type: 'job', location: '', description: '', applyLink: '', deadline: '', tagsString: ''
    });

    const fetchData = async () => {
        try {
            const safeFetch = async (url) => {
                try {
                    const res = await fetch(url);
                    return res.ok ? await res.json() : [];
                } catch (e) { console.warn(`Failed fetch ${url}`); return []; }
            };

            const [statsData, opsData, compsData, usersData, appsData, msgsData, viewsData] = await Promise.all([
                safeFetch(`${import.meta.env.VITE_API_URL}/stats`),
                safeFetch(`${import.meta.env.VITE_API_URL}/admin/opportunities`),
                safeFetch(`${import.meta.env.VITE_API_URL}/companies`),
                safeFetch(`${import.meta.env.VITE_API_URL}/users`),
                safeFetch(`${import.meta.env.VITE_API_URL}/admin/applications`),
                safeFetch(`${import.meta.env.VITE_API_URL}/admin/messages`),
                safeFetch(`${import.meta.env.VITE_API_URL}/analytics/dashboard`)
            ]);

            setStats({
                ...statsData,
                users: usersData.length || 0,
                companies: compsData.length || 0,
                opsTotal: opsData.length || 0,
                opsPending: opsData.filter(o => o.status === 'pending').length,
                opsApproved: opsData.filter(o => o.status === 'approved').length,
                opsFeatured: opsData.filter(o => o.isFeatured).length,
                appsTotal: appsData.length || 0,
                msgsUnread: msgsData.filter(m => !m.read).length
            });
            setOps(opsData);
            setCompanies(compsData);
            setUsers(usersData);
            setApplications(appsData);
            setMessages(msgsData);
            setAnalytics(viewsData);
        } catch (err) {
            console.error("Error fetching admin data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) navigate('/user/login');
        else if (user.role !== 'admin') navigate('/');
        else fetchData();
    }, [user, navigate]);

    // ACTIONS
    const handleSyncJobs = async () => {
        if (!window.confirm("Trigger automated job search? This may take a few seconds.")) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/trigger-aggregation`);
            const data = await res.json();
            alert(data.message || "Sync started!");
            setTimeout(fetchData, 3000);
        } catch (err) {
            alert("Failed to trigger sync");
        }
    };

    const handleOpAction = async (id, action) => {
        let updates = {};
        if (action === 'approve') updates = { status: 'approved' };
        if (action === 'reject') updates = { status: 'rejected' };
        if (action === 'feature') updates = { isFeatured: true };
        if (action === 'unfeature') updates = { isFeatured: false };

        await fetch(`${import.meta.env.VITE_API_URL}/admin/opportunities/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates)
        });
        fetchData();
    };

    const handleDeleteOp = async (id) => {
        if (window.confirm("Delete this opportunity?")) {
            await fetch(`${import.meta.env.VITE_API_URL}/admin/opportunities/${id}`, { method: 'DELETE' });
            setOps(prev => prev.filter(o => o.id !== id));
        }
    };

    const handleCompanyAction = async (id, action) => {
        const { check, rejectionReason } = action;
        await fetch(`${import.meta.env.VITE_API_URL}/admin/companies/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ check, rejectionReason })
        });
        fetchData();
    };

    const handleAppAction = async (id, status) => {
        await fetch(`${import.meta.env.VITE_API_URL}/admin/applications/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
        });
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    };

    const handlePostOp = async (e) => {
        e.preventDefault();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/opportunities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...newOp, status: 'approved', companyId: 'admin-manual', tags: newOp.tagsString.split(',').map(t => t.trim())
            })
        });
        if (res.ok) {
            alert("Opportunity Posted!");
            setNewOp({ title: '', company: '', type: 'job', location: '', description: '', applyLink: '', deadline: '', tagsString: '' });
            fetchData();
        }
    };

    // Chart Data (Dynamic)
    const typeCounts = ops.reduce((acc, op) => {
        const t = (op.type || 'other').toLowerCase();
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});

    const typeData = Object.keys(typeCounts).map(type => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: typeCounts[type]
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    return (
        <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
            <aside style={{ width: '250px', background: '#1F2937', color: 'white', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>🛡️ Admin Panel</div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {['overview', 'analytics', 'ops', 'companies', 'users', 'apps', 'messages'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '8px', background: activeTab === tab ? '#374151' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
                            {tab === 'ops' ? 'Opportunities' : tab}
                        </button>
                    ))}
                </nav>
                <div style={{ marginTop: 'auto', borderTop: '1px solid #374151', paddingTop: '1rem' }}>
                    <Link to="/" style={{ display: 'block', padding: '0.75rem', color: '#9CA3AF', textDecoration: 'none' }}>⬅ Home</Link>
                    <button onClick={logout} style={{ width: '100%', textAlign: 'left', padding: '0.75rem', background: 'transparent', color: '#EF4444', border: 'none', cursor: 'pointer' }}>Log Out</button>
                </div>
            </aside>

            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>Welcome, Admin</h1>
                        <p style={{ color: '#6B7280' }}>Dashboard Overview</p>
                    </div>
                    <button onClick={fetchData} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>Refresh</button>
                </header>

                {loading ? <div>Loading...</div> : (
                    <>
                        {activeTab === 'overview' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                <StatCard label="Total Users" value={stats.users} color="blue" />
                                <StatCard label="Companies" value={stats.companies} color="purple" />
                                <StatCard label="Active Jobs" value={stats.opsApproved} color="green" />
                                <StatCard label="Pending Jobs" value={stats.opsPending} color="yellow" />

                                <div style={{ gridColumn: 'span 4', background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                                    <h3>Opportunity Distribution</h3>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={typeData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                                                    {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                                {/* Row 1: Key Stats */}
                                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', gridColumn: 'span 2' }}>
                                    <h3>Overview</h3>
                                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                                        <div>
                                            <p style={{ color: '#666' }}>👥 Total Unique Visitors</p>
                                            <h2 style={{ fontSize: '2.5rem', color: '#3b82f6' }}>{analytics.totalVisitors}</h2>
                                        </div>
                                        <div>
                                            <p style={{ color: '#666' }}>📄 Total Page Views</p>
                                            <h2 style={{ fontSize: '2.5rem', color: '#10b981' }}>{analytics.topPages.reduce((acc, curr) => acc + parseInt(curr.count), 0)}</h2>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Traffic Trend */}
                                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', gridColumn: 'span 2', height: '350px' }}>
                                    <h3>📈 Daily Traffic (Last 7 Days)</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={analytics.dailyTraffic}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={3} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Row 3: Geo & Devices */}
                                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                                    <h3>🌍 Top Locations</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                                        {analytics.geo.map((g, i) => (
                                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                                                <span>{g.city === 'Unknown' ? g.country : `${g.city}, ${g.country}`}</span>
                                                <span style={{ fontWeight: 'bold' }}>{g.count}</span>
                                            </li>
                                        ))}
                                        {analytics.geo.length === 0 && <p style={{ color: '#999' }}>No location data yet.</p>}
                                    </ul>
                                </div>

                                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                                    <h3>📱 Devices</h3>
                                    <div style={{ height: '200px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={analytics.devices} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={80} fill="#82ca9d" label>
                                                    {analytics.devices.map((entry, index) => <Cell key={index} fill={index % 2 === 0 ? '#8884d8' : '#82ca9d'} />)}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Row 4: Sources & Pages */}
                                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                                    <h3>🔗 Top Traffic Sources</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                                        {analytics.sources.map((s, i) => (
                                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                                                <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {s.referrer === 'Direct' ? 'Direct / Bookmark' : s.referrer}
                                                </span>
                                                <span style={{ fontWeight: 'bold' }}>{s.count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', gridColumn: 'span 2' }}>
                                    <h3>📄 Most Viewed Pages</h3>
                                    <table style={{ width: '100%', marginTop: '1rem' }}>
                                        <thead><tr style={{ textAlign: 'left' }}><th>Path</th><th>Views</th></tr></thead>
                                        <tbody>
                                            {analytics.topPages.map((p, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.8rem 0', color: '#3b82f6' }}>{p.path}</td>
                                                    <td style={{ fontWeight: 'bold' }}>{p.count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        )}

                        {activeTab === 'ops' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h2>Manage Opportunities</h2>
                                    <button onClick={handleSyncJobs} style={{ background: '#4F46E5', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>🤖 Sync External Jobs</button>
                                </div>

                                {/* Post Op Form */}
                                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                                    <h3 style={{ marginBottom: '1rem' }}>Fast Post</h3>
                                    <form onSubmit={handlePostOp} style={{ display: 'grid', gap: '1rem' }}>
                                        <input placeholder="Title" value={newOp.title} onChange={e => setNewOp({ ...newOp, title: e.target.value })} required className="input" />
                                        <input placeholder="Company" value={newOp.company} onChange={e => setNewOp({ ...newOp, company: e.target.value })} required className="input" />
                                        <input placeholder="Apply URL" value={newOp.applyLink} onChange={e => setNewOp({ ...newOp, applyLink: e.target.value })} required className="input" />
                                        <button className="btn btn-primary">Post</button>
                                    </form>
                                </div>

                                <table style={{ width: '100%', background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                                    <thead style={{ background: '#f9fafb' }}><tr><th style={{ padding: '1rem' }}>Title</th><th style={{ padding: '1rem' }}>Status</th><th style={{ padding: '1rem' }}>Actions</th></tr></thead>
                                    <tbody>
                                        {ops.map(op => (
                                            <tr key={op.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div>{op.title}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'gray' }}>{op.company}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{op.status}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    {op.status === 'pending' && <button onClick={() => handleOpAction(op.id, 'approve')} style={{ color: 'green', marginRight: '0.5rem' }}>Approve</button>}
                                                    <button onClick={() => handleDeleteOp(op.id)} style={{ color: 'red', marginRight: '0.5rem' }}>Delete</button>
                                                    <button onClick={() => handleOpAction(op.id, op.isFeatured ? 'unfeature' : 'feature')} style={{ color: op.isFeatured ? '#d97706' : '#4f46e5', fontWeight: 'bold' }}>
                                                        {op.isFeatured ? '★ Unfeature' : '☆ Feature'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'companies' && (
                            <div>
                                <h2>Companies</h2>
                                {companies.map(c => (
                                    <div key={c.id} style={{ background: 'white', padding: '1rem', marginBottom: '0.5rem', borderRadius: '8px' }}>
                                        <div>{c.name} ({c.email})</div>
                                        <div>Status: {c.check || 'pending'}</div>
                                        {c.check === 'pending' && <button onClick={() => handleCompanyAction(c.id, { check: 'approved' })}>Approve</button>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div>
                                <h2>Users</h2>
                                <table style={{ width: '100%', background: 'white' }}>
                                    <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                                    <tbody>{users.map(u => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'apps' && (
                            <div>
                                <h2>Applications</h2>
                                {applications.map(app => (
                                    <div key={app.id} style={{ background: 'white', padding: '1rem', marginBottom: '0.5rem' }}>
                                        <div>Applicant: {app.fullName}</div>
                                        <div>Job ID: {app.opportunityId}</div>
                                        <div>Status: {app.status}</div>
                                        <select value={app.status} onChange={(e) => handleAppAction(app.id, e.target.value)}>
                                            <option value="pending">Pending</option>
                                            <option value="reviewed">Reviewed</option>
                                            <option value="interview">Interview</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="hired">Hired</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'messages' && (
                            <div>
                                <h2>Messages</h2>
                                {messages.map(m => (
                                    <div key={m.id} style={{ background: 'white', padding: '1rem', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>{m.subject}</div>
                                        <div>From: {m.name} ({m.email})</div>
                                        <p>{m.message}</p>
                                        <div style={{ fontSize: '0.8rem' }}>{m.createdAt}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

const StatCard = ({ label, value, color }) => (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
        <p style={{ color: 'gray' }}>{label}</p>
        <h3 style={{ fontSize: '2rem', color }}>{value}</h3>
    </div>
);

export default AdminDashboard;
