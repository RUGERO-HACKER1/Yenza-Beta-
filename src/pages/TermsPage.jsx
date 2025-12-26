import React from 'react';

const TermsPage = () => {
    return (
        <div className="container" style={{ maxWidth: '800px', paddingTop: '4rem', paddingBottom: '6rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem' }}>Terms of Use</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Last Updated: December 2025</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>1. Introduction</h2>
                <p style={{ lineHeight: '1.6', color: '#4B5563' }}>
                    Welcome to Yenza. By accessing our website, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>2. Use License</h2>
                <p style={{ lineHeight: '1.6', color: '#4B5563' }}>
                    Permission is granted to temporarily download one copy of the materials (information or software) on Yenza's website for personal, non-commercial transitory viewing only.
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>3. Disclaimer</h2>
                <p style={{ lineHeight: '1.6', color: '#4B5563' }}>
                    The materials on Yenza's website are provided on an 'as is' basis. Yenza makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
            </section>
        </div>
    );
};

export default TermsPage;
