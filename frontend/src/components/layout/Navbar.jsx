import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = () => {
    if (user) {
      fetch(`${import.meta.env.VITE_API_URL}/notifications?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        });
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000); // Polling every 5s
      return () => clearInterval(interval);
    }
  }, [user]);

  const markRead = (id) => {
    fetch(`http://localhost:5000/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true })
    }).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    });
  }

  return (
    <nav style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/img/logo.svg" alt="Yenza Logo" style={{ height: '40px' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', background: '#EEF2FF', padding: '2px 8px', borderRadius: '12px', border: '1px solid #C7D2FE' }}>BETA</span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/opportunities" style={{ fontWeight: '500', fontSize: '0.95rem', color: 'var(--text-body)' }}>Explore</Link>
          <Link to="/events" style={{ fontWeight: '500', fontSize: '0.95rem', color: 'var(--text-body)' }}>Events</Link>
          <Link to="/companies" style={{ fontWeight: '500', fontSize: '0.95rem', color: 'var(--text-body)' }}>For Companies</Link>

          {user ? (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>

              {/* Notifications Bell */}
              <div style={{ position: 'relative', cursor: 'pointer', marginRight: '0.5rem' }} onClick={() => setShowNotif(!showNotif)}>
                <span style={{ fontSize: '1.5rem' }}>🔔</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-5px',
                    background: 'red', color: 'white', borderRadius: '50%',
                    width: '18px', height: '18px', fontSize: '0.7rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}

                {/* Dropdown */}
                {showNotif && (
                  <div style={{
                    position: 'absolute', top: '160%', right: '-10px', width: '360px',
                    background: 'white', border: '1px solid var(--border)', borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '0', zIndex: 200, cursor: 'default', overflow: 'hidden'
                  }} onClick={e => e.stopPropagation()}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>Notifications</h4>
                      {unreadCount > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>{unreadCount} New</span>}
                    </div>

                    <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                      {notifications.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔕</div>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>No notifications yet</p>
                        </div>
                      )}
                      {notifications.map(n => (
                        <div key={n.id}
                          onClick={() => markRead(n.id)}
                          style={{
                            padding: '1rem',
                            background: n.read ? 'white' : '#f0f9ff',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            position: 'relative'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = n.read ? 'white' : '#f0f9ff'}
                        >
                          {!n.read && <span style={{ position: 'absolute', top: '1.2rem', left: '0.5rem', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></span>}
                          <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--text-body)', fontWeight: n.read ? '400' : '600', paddingLeft: '0.5rem' }}>{n.message}</p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', paddingLeft: '0.5rem' }}>{new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Logic for Role */}
              {user.role === 'admin' ? (
                <Link to="/admin" style={{ fontWeight: '600', color: 'var(--primary)' }}>Admin Panel</Link>
              ) : user.role === 'user' ? (
                <Link to="/profile" style={{ fontWeight: '600', color: 'var(--primary)' }}>My Profile</Link>
              ) : (
                <Link to="/dashboard" style={{ fontWeight: '600', color: 'var(--primary)' }}>Dashboard</Link>
              )}

              <button
                onClick={() => {
                  logout();
                  window.location.href = '/'; // Force a hard refresh/navigate to clear state cleanly
                }}
                className="btn btn-outline"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/login" style={{ fontWeight: '500', fontSize: '0.95rem' }}>Log In</Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
