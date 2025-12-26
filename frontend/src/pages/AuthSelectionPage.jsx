import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AuthSelectionPage = () => {
    const location = useLocation();
    const isSignup = location.pathname.includes('signup');

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            background: 'var(--bg-body)'
        }}>
            <div className="container" style={{ textAlign: 'center' }}>
                <h1 style={{ marginBottom: '1rem' }}>
                    {isSignup ? 'Join Opportunity.ZH' : 'Welcome Back'}
                </h1>
                <p style={{ color: 'var(--text-body)', marginBottom: '3rem' }}>
                    Choose how you want to continue
                </p>

                <div className="grid grid-2" style={{ maxWidth: '800px', margin: '0 auto', gap: '2rem' }}>
                    {/* Candidate / User Card */}
                    <div className="card" style={{
                        padding: '3rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.5rem',
                        cursor: 'default',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div style={{ fontSize: '4rem' }}>👨‍🎓</div>
                        <div>
                            <h3>I am Talent</h3>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                Find jobs, internships, and build your profile.
                            </p>
                        </div>
                        <Link
                            to={isSignup ? '/user/signup' : '/user/login'}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            {isSignup ? 'Join as Talent' : 'Log In as Talent'}
                        </Link>
                    </div>

                    {/* Employer / Company Card */}
                    <div className="card" style={{
                        padding: '3rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.5rem',
                        cursor: 'default',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div style={{ fontSize: '4rem' }}>🏢</div>
                        <div>
                            <h3>I am an Employer</h3>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                Post opportunities and hire talent.
                            </p>
                        </div>
                        <Link
                            to={isSignup ? '/company/signup' : '/company/login'}
                            className="btn btn-outline"
                            style={{ width: '100%' }}
                        >
                            {isSignup ? 'Join as Employer' : 'Log In as Employer'}
                        </Link>
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    {isSignup ? (
                        <p>Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Log In</Link></p>
                    ) : (
                        <p>New here? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '600' }}>Create an Account</Link></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthSelectionPage;
