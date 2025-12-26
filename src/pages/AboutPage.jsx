import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
    return (
        <div style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '2rem', color: '#1F2937' }}>About Yenza</h1>

                <p style={{ fontSize: '1.25rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                    Yenza is a growing opportunity platform built to make access simple and fair.
                </p>

                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                    We believe that talent is equally distributed, but opportunity is not. Yenza exists to bridge that gap by connecting students, graduates, and freelancers with the best companies and organizations in Rwanda.
                </p>

                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '3rem', marginBottom: '1.5rem', color: '#1F2937' }}>Who is it for?</h2>
                <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.1rem', color: '#4B5563', lineHeight: '1.8' }}>
                    <li style={{ marginBottom: '1rem' }}>🎓 <strong>Students & Graduates:</strong> Find internships and entry-level jobs.</li>
                    <li style={{ marginBottom: '1rem' }}>💻 <strong>Freelancers:</strong> Discover gigs and short-term projects.</li>
                    <li style={{ marginBottom: '1rem' }}>🏢 <strong>Companies:</strong> Hire verified local talent easily.</li>
                </ul>

                <div style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', padding: '1.5rem', borderRadius: '12px', marginTop: '3rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1E40AF', marginBottom: '0.5rem' }}>ℹ️ Beta Status</h3>
                    <p style={{ color: '#1E3A8A' }}>
                        Yenza is currently in Public Beta. We are actively adding new features and ensuring platform stability.
                        If you encounter any issues, please <Link to="/contact" style={{ color: '#2563EB', fontWeight: 'bold' }}>contact us</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
