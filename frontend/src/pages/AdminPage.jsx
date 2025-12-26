import React, { useState, useEffect } from 'react';

const AdminPage = () => {
    const [ops, setOps] = useState([]);

    const fetchOps = () => {
        fetch(`${import.meta.env.VITE_API_URL}/admin/opportunities`)
            .then(res => res.json())
            .then(data => setOps(data));
    };

    useEffect(() => {
        fetchOps();
    }, []);

    const updateStatus = (id, newStatus) => {
        fetch(`${import.meta.env.VITE_API_URL}/admin/opportunities/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })
            .then(() => fetchOps());
    };

    const toggleFeatured = (id, currentStatus) => {
        fetch(`${import.meta.env.VITE_API_URL}/admin/opportunities/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFeatured: !currentStatus })
        })
            .then(() => fetchOps());
    };

    return (
        <div className="container" style={{ padding: '4rem 24px' }}>
            <h1>Admin Dashboard</h1>
            <p style={{ marginBottom: '2rem' }}>Manage Opportunities</p>

            <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '1rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Title</th>
                            <th style={{ padding: '1rem' }}>Company</th>
                            <th style={{ padding: '1rem' }}>Type</th>
                            <th style={{ padding: '1rem' }}>Tags</th>
                            <th style={{ padding: '1rem' }}>Featured</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ops.map(op => (
                            <tr key={op.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>{op.title}</td>
                                <td style={{ padding: '1rem' }}>
                                    {op.company}<br />
                                    <span style={{ fontSize: '0.8rem', color: 'gray' }}>{op.companyId ? `(ID: ${op.companyId})` : ''}</span>
                                </td>
                                <td style={{ padding: '1rem' }}><span className={`tag tag-${op.type}`}>{op.type}</span></td>
                                <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{op.tags ? op.tags.join(', ') : '-'}</td>
                                <td style={{ padding: '1rem' }}>
                                    <button onClick={() => toggleFeatured(op.id, op.isFeatured)} style={{ cursor: 'pointer', opacity: op.isFeatured ? 1 : 0.3 }}>
                                        {op.isFeatured ? '⭐ YES' : '☆ NO'}
                                    </button>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                        backgroundColor: op.status === 'approved' ? '#dcfce7' : op.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                        color: op.status === 'approved' ? '#166534' : op.status === 'rejected' ? '#991b1b' : '#92400e'
                                    }}>
                                        {op.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    {op.status !== 'approved' && (
                                        <button onClick={() => updateStatus(op.id, 'approved')} style={{ padding: '0.4rem 0.8rem', background: 'green', color: 'white', borderRadius: '4px', fontSize: '0.8rem' }}>Approve</button>
                                    )}
                                    {op.status !== 'rejected' && (
                                        <button onClick={() => updateStatus(op.id, 'rejected')} style={{ padding: '0.4rem 0.8rem', background: 'red', color: 'white', borderRadius: '4px', fontSize: '0.8rem' }}>Reject</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPage;
