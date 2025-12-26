import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const OnboardingModal = () => {
    const { user, login } = useAuth(); // login is used to update the user context
    const [formData, setFormData] = useState({
        name: '',
        nationality: '',
        education: 'Bachelor',
        birthday: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    isProfileComplete: true
                })
            });
            const updatedUser = await res.json();

            if (res.ok) {
                // Update local context with new user data
                login({ ...updatedUser, role: 'user' });
            } else {
                setError(updatedUser.message || 'Failed to save profile');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    // If user is not logged in, or already completed profile, or is a company, don't show
    if (!user || user.role !== 'user' || user.isProfileComplete) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, backdropFilter: 'blur(5px)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Welcome to Opportunity.ZH!</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-body)', marginBottom: '2rem' }}>
                    Please complete your profile to continue.
                </p>

                {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nationality</label>
                        <input
                            type="text"
                            value={formData.nationality}
                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                            style={{ width: '100%' }}
                            required
                            placeholder="e.g. Rwandan"
                        />
                    </div>

                    <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Education Level</label>
                            <select
                                value={formData.education}
                                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                style={{ width: '100%' }}
                            >
                                <option value="High School">High School</option>
                                <option value="Bachelor">Bachelor's Degree</option>
                                <option value="Master">Master's Degree</option>
                                <option value="PhD">PhD</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Birthday</label>
                            <input
                                type="date"
                                value={formData.birthday}
                                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                style={{ width: '100%' }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Complete Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingModal;
