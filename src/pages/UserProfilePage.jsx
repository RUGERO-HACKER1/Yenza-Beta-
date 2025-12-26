import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const UserProfilePage = () => {
    const { user, logout, login } = useAuth();
    const navigate = useNavigate();
    const [bookmarks, setBookmarks] = useState([]);
    const [applications, setApplications] = useState([]); // List of application objects
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'user') {
            navigate('/user/login');
            return;
        }

        const fetchData = async () => {
            // 1. Fetch User (for Bookmarks)
            const userRes = await fetch(`http://localhost:5000/users/${user.id}`);
            const userData = await userRes.json();

            if (JSON.stringify(userData.bookmarks) !== JSON.stringify(user.bookmarks)) {
                login({ ...user, ...userData });
            }

            // 2. Fetch Opportunities (cache this in real app)
            const opsRes = await fetch('http://localhost:5000/opportunities');
            const opsData = await opsRes.json();

            // Resolve Bookmarks
            if (userData.bookmarks && userData.bookmarks.length > 0) {
                const userBookmarks = opsData.filter(op => userData.bookmarks.includes(op.id));
                setBookmarks(userBookmarks);
            } else {
                setBookmarks([]);
            }

            // 3. Fetch Applications
            const appsRes = await fetch(`http://localhost:5000/applications?userId=${user.id}`);
            const appsData = await appsRes.json();

            // Merge Application Status with Opportunity Details
            const myApps = appsData.map(app => {
                const op = opsData.find(o => o.id === app.opportunityId);
                return { ...app, opportunity: op };
            });
            setApplications(myApps);

            setLoading(false);
        };
        fetchData();
    }, [user, navigate]);

    if (!user) return null;

    const removeBookmark = async (opId) => {
        const newBookmarks = user.bookmarks.filter(id => id !== opId);
        setBookmarks(bookmarks.filter(b => b.id !== opId));
        await fetch(`http://localhost:5000/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookmarks: newBookmarks })
        });
        login({ ...user, bookmarks: newBookmarks });
    };

    return (
        <div className="container" style={{ padding: '4rem 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '80px', height: '80px', background: '#bfdbfe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        👤
                    </div>
                    <div>
                        <h1 style={{ marginBottom: '0.25rem' }}>{user.name}</h1>
                        <p style={{ color: 'var(--text-light)' }}>{user.email}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/contact" className="btn btn-outline" style={{ textDecoration: 'none', color: '#374151', borderColor: '#D1D5DB' }}>
                        💬 Contact Support
                    </Link>
                </div>
            </div>

            <div className="grid grid-2" style={{ alignItems: 'start' }}>
                {/* Bookmarks Section */}
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Saved Opportunities</h2>
                    {loading ? <div>Loading...</div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {bookmarks.length === 0 && <p style={{ color: 'var(--text-light)' }}>No bookmarks yet.</p>}
                            {bookmarks.map(op => (
                                <div key={op.id} style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <Link to={`/opportunities/${op.id}`} style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>{op.title}</Link>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{op.company}</span>
                                    </div>
                                    <button onClick={() => removeBookmark(op.id)} style={{ color: 'red', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Applications Section */}
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>My Applications</h2>
                    {loading ? <div>Loading...</div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {applications.length === 0 && <p style={{ color: 'var(--text-light)' }}>No applications sent yet.</p>}
                            {applications.map(app => (
                                <div key={app.id} style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <Link to={`/opportunities/${app.opportunityId}`} style={{ fontWeight: 'bold' }}>{app.opportunity ? app.opportunity.title : 'Unknown Role'}</Link>
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
                                            backgroundColor: app.status === 'shortlisted' ? '#dcfce7' : app.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                            color: app.status === 'shortlisted' ? '#166534' : app.status === 'rejected' ? '#991b1b' : '#92400e'
                                        }}>
                                            {app.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                        {app.opportunity ? app.opportunity.company : 'Unknown Company'} • Applied: {new Date(app.submittedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
