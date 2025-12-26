import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ContactPage = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'Support',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSuccess(true);
                setFormData({ name: user?.name || '', email: user?.email || '', subject: 'Support', message: '' });
            } else {
                setError('Failed to send message. Please ensure the server is running.');
            }
        } catch (err) {
            console.error(err);
            setError('Network error. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '600px', paddingTop: '4rem', paddingBottom: '6rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1F2937' }}>How can we help?</h1>
                <p style={{ fontSize: '1.1rem', color: '#6B7280' }}>
                    We usually respond within a few hours.
                </p>
            </div>

            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                {success ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                        <h3 style={{ color: '#059669', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Message Sent!</h3>
                        <p style={{ color: '#4B5563' }}>We've received your message and will get back to you at <strong>{formData.email || 'your email'}</strong>.</p>
                        <button onClick={() => setSuccess(false)} style={{ marginTop: '2rem', padding: '0.8rem 1.5rem', background: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#374151' }}>Send another</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Hidden/Auto-filled fields if user is logged in for simpler look? Or distinct styling? 
                            Let's keep them visible but filled so they can change if needed. */}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>Name</label>
                                <input
                                    type="text" name="name" required
                                    value={formData.name} onChange={handleChange}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', background: user?.name ? '#F3F4F6' : 'white' }}
                                    placeholder="Your Name"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>Email</label>
                                <input
                                    type="email" name="email" required
                                    value={formData.email} onChange={handleChange}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', background: user?.email ? '#F3F4F6' : 'white' }}
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>Message</label>
                            <textarea
                                name="message" required rows="5"
                                value={formData.message} onChange={handleChange}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontFamily: 'inherit' }}
                                placeholder="Tell us what you need..."
                            />
                        </div>

                        {error && <div style={{ padding: '0.8rem', background: '#FEF2F2', color: '#B91C1C', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #FECACA' }}>{error}</div>}

                        <button
                            type="submit" disabled={submitting}
                            className="btn btn-primary"
                            style={{
                                marginTop: '0.5rem', width: '100%', padding: '1rem',
                                borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold',
                                background: 'linear-gradient(to right, #2563EB, #4F46E5)', border: 'none', color: 'white', cursor: 'pointer', transition: 'opacity 0.2s'
                            }}
                        >
                            {submitting ? 'Sending...' : 'Send Message 🚀'}
                        </button>
                    </form>
                )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
                Or email us directly at <a href="mailto:support@yenza.rw" style={{ color: '#4B5563', fontWeight: '600', textDecoration: 'none' }}>support@yenza.rw</a>
            </div>
        </div>
    );
};

export default ContactPage;
