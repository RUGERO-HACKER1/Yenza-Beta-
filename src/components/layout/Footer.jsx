import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer style={{ backgroundColor: '#fff', borderTop: '1px solid var(--border)', padding: '4rem 0', marginTop: 'auto' }}>
            <div className="container">
                <div className="grid grid-4" style={{ gap: '4rem' }}>
                    <div>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: '800', fontSize: '1.25rem' }}>Yenza</h3>
                        <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            Where opportunities turn into action. Connect with the best companies and launch your career.
                        </p>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Explore</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-body)', fontSize: '0.9rem' }}>
                            <li><Link to="/opportunities?type=job">Jobs</Link></li>
                            <li><Link to="/opportunities?type=internship">Internships</Link></li>
                            <li><Link to="/opportunities?type=event">Events</Link></li>
                            <li><Link to="/opportunities?type=gig">Gigs</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Company</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-body)', fontSize: '0.9rem' }}>
                            <li><Link to="/about">About Yenza</Link></li>
                            <li><Link to="/post">Post an Opportunity</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Social</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-body)', fontSize: '0.9rem' }}>
                            <li><a href="#">Instagram</a></li>
                            <li><a href="#">LinkedIn</a></li>
                            <li><a href="#">Twitter</a></li>
                        </ul>
                    </div>
                </div>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                    © 2025 Yenza (Beta). All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
