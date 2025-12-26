import React from 'react';

const PrivacyPage = () => {
    return (
        <div className="container" style={{ maxWidth: '800px', paddingTop: '4rem', paddingBottom: '6rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem' }}>Privacy Policy</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Last Updated: December 2025</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>1. Data Collection</h2>
                <p style={{ lineHeight: '1.6', color: '#4B5563' }}>
                    We collect information that you provide directly to us when you create an account, update your profile, post opportunities, or communicate with us. This may include your name, email address, phone number, and professional details.
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>2. Use of Information</h2>
                <p style={{ lineHeight: '1.6', color: '#4B5563' }}>
                    We use the information we collect to provide, maintain, and improve our services, to process your applications, and to communicate with you about new opportunities.
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>3. Data Sharing</h2>
                <p style={{ lineHeight: '1.6', color: '#4B5563' }}>
                    We do not share your personal information with third parties except as described in this policy (e.g., sharing your profile with companies you apply to) or with your consent.
                </p>
            </section>
        </div>
    );
};

export default PrivacyPage;
