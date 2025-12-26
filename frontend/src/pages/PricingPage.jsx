import React from 'react';
import { Link } from 'react-router-dom';

const PricingPage = () => {
    return (
        <div className="container" style={{ padding: '4rem 24px' }}>
            <div className="section-title">
                <h2>Pricing & Plans</h2>
                <p>Choose the right plan to amplify your reach.</p>
            </div>

            <div className="grid grid-3" style={{ alignItems: 'start' }}>
                {/* Free Plan */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Starter</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Free</div>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <li>✅ Post 1 Active Opportunity</li>
                        <li>✅ Basic Company Profile</li>
                        <li>✅ Community Support</li>
                    </ul>
                    <Link to="/signup" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>Get Started</Link>
                </div>

                {/* Pro Plan */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--primary)', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>MOST POPULAR</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Pro</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>$49<span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-light)' }}>/mo</span></div>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <li>✅ Unlimited Posts</li>
                        <li>✅ <strong>5 Featured Posts</strong> per month</li>
                        <li>✅ Priority Support</li>
                        <li>✅ Verified Badge</li>
                    </ul>
                    <Link to="/signup" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>Start Free Trial</Link>
                </div>

                {/* Enterprise */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Enterprise</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Custom</div>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <li>✅ Dedicated Account Manager</li>
                        <li>✅ API Access</li>
                        <li>✅ Brand Customization</li>
                        <li>✅ Analytics Dashboard</li>
                    </ul>
                    <button className="btn btn-outline" style={{ width: '100%' }}>Contact Sales</button>
                </div>
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                <h3>Why Feature?</h3>
                <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                    Featured opportunities appear at the top of search results, on the home page, and get <strong>3x more views</strong> on average.
                </p>
            </div>
        </div>
    );
};

export default PricingPage;
