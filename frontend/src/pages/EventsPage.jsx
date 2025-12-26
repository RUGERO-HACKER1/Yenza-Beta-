import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming'); // upcoming, past

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/opportunities`)
            .then(res => res.json())
            .then(data => {
                // Filter only events
                const allEvents = data.filter(op => op.type === 'event');
                setEvents(allEvents);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    const filteredEvents = events.filter(ev => {
        const now = new Date();
        const start = new Date(ev.startDate || ev.createdAt); // Fallback if old data
        if (filter === 'upcoming') return start >= now;
        return start < now;
    });

    const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (loading) return <div className="container" style={{ padding: '4rem' }}>Loading events...</div>;

    return (
        <div className="container" style={{ padding: '4rem 24px' }}>
            <div className="section-title">
                <h2>Events & Workshops</h2>
                <p>Learn, network, and grow.</p>
            </div>

            {/* Filter Toggle */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
                <button onClick={() => setFilter('upcoming')} className={`btn ${filter === 'upcoming' ? 'btn-primary' : 'btn-outline'}`}>Upcoming</button>
                <button onClick={() => setFilter('past')} className={`btn ${filter === 'past' ? 'btn-primary' : 'btn-outline'}`}>Past Events</button>
            </div>

            <div className="grid grid-3">
                {sortedEvents.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
                        No {filter} events found.
                    </div>
                ) : (
                    sortedEvents.map(ev => (
                        <Link to={`/opportunities/${ev.id}`} key={ev.id} style={{
                            backgroundColor: 'white',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid var(--border)',
                            textDecoration: 'none',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ height: '120px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '3rem' }}>
                                📅
                            </div>
                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                    {new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>{ev.title}</h3>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem' }}>by {ev.company}</p>

                                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {ev.tags && ev.tags.map(t => (
                                        <span key={t} style={{ fontSize: '0.75rem', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px' }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default EventsPage;
