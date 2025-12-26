import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserLoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/auth/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                login(data); // Trust the role from backend
                if (data.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/profile');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Connection error');
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 24px', maxWidth: '500px' }}>
            <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Talent Login</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Log In as Talent</button>

                    <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
                        Are you a company? <Link to="/company/login" style={{ color: 'var(--primary)' }}>Log in here</Link>
                    </div>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    New here? <Link to="/user/signup" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Create User Account</Link>
                </p>
            </div>
        </div>
    );
};

export default UserLoginPage;
