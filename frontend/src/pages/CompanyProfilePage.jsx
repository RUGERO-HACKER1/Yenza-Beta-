import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const CompanyProfilePage = () => {
    const { id } = useParams();
    const [company, setCompany] = useState(null);
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Company
                const compRes = await fetch(`${import.meta.env.VITE_API_URL}/companies/${id}`);
                const compData = await compRes.json();
                setCompany(compData);

                // Fetch their jobs
                const oppsRes = await fetch(`${import.meta.env.VITE_API_URL}/opportunities`);
                const oppsData = await oppsRes.json();
                // Filter opportunities by this company id OR name (fallback)
                const companyOpps = oppsData.filter(op =>
                    (op.companyId && op.companyId === id) ||
                    (op.company && op.company === compData.name)
                );
                setOpportunities(companyOpps);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
    if (!company) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Company not found.</div>;

    return (
        <div className="container" style={{ padding: '4rem 24px' }}>

            {/* Profile Header */}
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', border: '1px solid var(--border)', marginBottom: '3rem' }}>
                <div style={{ width: '80px', height: '80px', background: '#f3f4f6', borderRadius: '50%', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                    🏢
                </div>
                <h1 style={{ marginBottom: '1rem' }}>{company.name}</h1>
                <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem', color: 'var(--text-body)', lineHeight: '1.6' }}>
                    {company.description || "A great company on Opportunity.zh"}
                </p>
                {company.website && (
                    <a href={company.website} target="_blank" rel="noreferrer" className="btn btn-outline">Visit Website</a>
                )}
            </div>

            {/* Company Opportunities */}
            <div className="section-title">
                <h2>Opportunities at {company.name}</h2>
            </div>

            <div className="grid grid-3">
                {opportunities.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-light)' }}>No active opportunities at the moment.</div>
                ) : (
                    opportunities.map(op => (
                        <Link to={`/opportunities/${op.id}`} key={op.id} style={{
                            backgroundColor: 'white',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.5rem',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            transition: 'all 0.2s',
                            textDecoration: 'none'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <span className={`tag tag-${op.type}`}>{op.type}</span>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{op.title}</h3>
                                <p style={{ color: 'var(--text-body)', fontSize: '0.9rem' }}>{op.location}</p>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--bg-input)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                <span>DETAILS &rarr;</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>

        </div>
    );
};

export default CompanyProfilePage;
