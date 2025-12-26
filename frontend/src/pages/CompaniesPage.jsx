import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CompaniesPage = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app we would have a specific endpoint for companies
        // For MVP we can just manually read the db.json companies, or create an endpoint
        // Let's create an endpoint in the next step, but for now assuming it exists
        fetch(`${import.meta.env.VITE_API_URL}/companies`)
            .then(res => res.json())
            .then(data => {
                setCompanies(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="container" style={{ padding: '4rem 24px' }}>
            <div className="section-title">
                <h2>Our Partners</h2>
                <p>Join the best companies.</p>
            </div>

            {loading ? <div style={{ textAlign: 'center' }}>Loading companies...</div> : (
                <div className="grid grid-4">
                    {companies.map(company => (
                        <Link to={`/companies/${company.id}`} key={company.id} style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid var(--border)',
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            textAlign: 'center'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                        >
                            <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                🏢
                            </div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{company.name}</h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>View Profile &rarr;</span>
                        </Link>
                    ))}
                </div>
            )}

        </div>
    );
};

export default CompaniesPage;
