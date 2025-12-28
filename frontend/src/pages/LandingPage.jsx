import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    const [featuredOps, setFeaturedOps] = useState([]);
    const [stats, setStats] = useState({ users: 0, companies: 0, opportunities: 0, applications: 0 });

    useEffect(() => {
        // Fetch Featured
        fetch(`${import.meta.env.VITE_API_URL}/opportunities`)
            .then(res => res.json())
            .then(data => {
                const featured = data.filter(op => op.isFeatured).slice(0, 3);
                setFeaturedOps(featured);
            })
            .catch(err => console.error(err));

        // Fetch Stats (Phase 19)
        fetch(`${import.meta.env.VITE_API_URL}/stats`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            {/* HERO SECTION 2.0 */}
            <section style={{
                padding: '8rem 0 0',
                textAlign: 'center',
                background: 'radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)', // Modern Aurora effect
                marginBottom: '4rem',
                borderBottom: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <div className="container" style={{ maxWidth: '1000px', position: 'relative', paddingBottom: '6rem' }}>
                    {/* Floating Elements (Decorative) */}
                    <div style={{ position: 'absolute', top: '10%', left: '-5%', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', transform: 'rotate(-10deg)', zIndex: 0 }}>
                        <span style={{ fontSize: '1.5rem' }}>👩‍💻</span> <strong>Developer</strong> just hired!
                    </div>
                    <div style={{ position: 'absolute', top: '20%', right: '-5%', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', transform: 'rotate(5deg)', zIndex: 0 }}>
                        <span style={{ fontSize: '1.5rem' }}>💰</span> <strong>New Gig</strong> posted!
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <span style={{
                            display: 'inline-block', padding: '0.5rem 1rem',
                            background: '#EEF2FF', color: 'var(--primary)',
                            borderRadius: 'var(--radius-full)', fontSize: '0.9rem',
                            fontWeight: '600', marginBottom: '2rem',
                            border: '1px solid #C7D2FE'
                        }}>
                            ✨ Yenza (Beta): The #1 Platform for Rwanda's Talent
                        </span>
                        <h1 style={{ marginBottom: '1.5rem', fontWeight: '800', fontSize: '3.5rem', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                            Yenza.<br />
                            <span style={{ color: 'var(--primary)', background: 'linear-gradient(45deg, #4f46e5, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Where opportunities turn into action.</span>
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: '#4B5563', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
                            Yenza is an all-in-one opportunity platform where companies post jobs, internships, gigs, and events, and talents discover and apply safely.
                        </p>

                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                            <Link to="/opportunities" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)' }}>
                                Find Work 🚀
                            </Link>
                            <Link to="/companies" className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', background: 'white' }}>
                                For Companies 🏢
                            </Link>
                        </div>
                    </div>
                </div>

                {/* STATS STRIP (Dynamic) */}
                <div style={{ background: 'white', borderTop: '1px solid #e5e7eb', padding: '2rem 0' }}>
                    <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1F2937', marginBottom: '0' }}>Growing</h3>
                            <p style={{ color: '#6B7280', fontWeight: '500' }}>Talents Joined</p>
                        </div>
                        <div style={{ textAlign: 'center', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', padding: '0 4rem' }}>
                            <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0' }}>Curated</h3>
                            <p style={{ color: '#6B7280', fontWeight: '500' }}>Opportunities</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1F2937', marginBottom: '0' }}>Verified</h3>
                            <p style={{ color: '#6B7280', fontWeight: '500' }}>Organizations</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* GIG ECONOMY BANNER (Premium Polish) */}
            <section className="container" style={{ marginBottom: '6rem' }}>
                <div style={{
                    background: 'linear-gradient(120deg, #059669 0%, #10B981 100%)',
                    borderRadius: '24px',
                    padding: '4rem',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '2rem',
                    boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative Circle */}
                    <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>

                    <div style={{ flex: 1, minWidth: '300px', position: 'relative', zIndex: 1 }}>
                        <span style={{
                            background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            padding: '0.4rem 1rem',
                            borderRadius: '99px',
                            fontSize: '0.85rem',
                            fontWeight: '800',
                            letterSpacing: '0.05em',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}>
                            ⚡ NEW: GIG ECONOMY
                        </span>
                        <h2 style={{ fontSize: '3rem', fontWeight: '800', margin: '1.5rem 0 1rem', lineHeight: '1.1' }}>
                            Turn your skills into income.
                        </h2>
                        <p style={{ fontSize: '1.25rem', opacity: '0.95', fontWeight: '500', maxWidth: '500px' }}>
                            Post a service or find short-term work. Get paid today.
                        </p>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="btn" style={{
                            background: 'white',
                            color: '#10B981', // Darker green for text
                            padding: '1.2rem 2.5rem',
                            fontSize: '1.1rem',
                            fontWeight: '800',
                            border: 'none',
                            borderRadius: '16px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            cursor: 'default', // Unclickable
                            opacity: '0.9'
                        }}>
                            Submit a Gig → Earn Money Today
                        </div>
                    </div>
                </div>
            </section>



            {/* WHO WE HELP SECTION (Phase 19.4) */}
            <section style={{ background: '#F3F4F6', padding: '6rem 0', marginBottom: '6rem' }}>
                <div className="container">
                    <div className="section-title">
                        <h2>Who We Help</h2>
                        <p>Empowering the entire ecosystem of talent development.</p>
                    </div>
                    <div className="grid grid-4" style={{ gap: '2rem' }}>
                        {/* Job Seekers & Students */}
                        <div className="card" style={{ border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                            <div style={{ background: '#DBEAFE', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1E40AF' }}>🎓</div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1F2937' }}>Job Seekers</h3>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#4B5563', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Find Full-time & Part-time jobs</li>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Discover Internships</li>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Create a professional profile</li>
                            </ul>
                        </div>

                        {/* Companies */}
                        <div className="card" style={{ border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                            <div style={{ background: '#D1FAE5', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.5rem', color: '#065F46' }}>🏢</div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1F2937' }}>Companies</h3>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#4B5563', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Post Jobs, Gigs, and Events</li>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Manage Applications</li>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Access verified talent pool</li>
                            </ul>
                        </div>

                        {/* Freelancers */}
                        <div className="card" style={{ border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                            <div style={{ background: '#FEE2E2', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.5rem', color: '#991B1B' }}>💻</div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1F2937' }}>Freelancers</h3>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#4B5563', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Find flexible Gigs</li>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Work on short-term projects</li>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Build your portfolio</li>
                            </ul>
                        </div>

                        {/* Community */}
                        <div className="card" style={{ border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                            <div style={{ background: '#FEF3C7', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.5rem', color: '#92400E' }}>📅</div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1F2937' }}>Community</h3>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#4B5563', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Host Events & Workshops</li>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Register for meetups</li>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Network with peers</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Section */}
            {featuredOps.length > 0 && (
                <section className="container" style={{ marginBottom: '6rem' }}>
                    <div className="section-title">
                        <h2>Featured Opportunities 🔥</h2>
                        <p>Top picks for this week.</p>
                    </div>
                    <div className="grid grid-3">
                        {featuredOps.map(op => (
                            <Link to={`/opportunities/${op.id}`} key={op.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textDecoration: 'none', position: 'relative' }}>
                                {/* Badge */}
                                <div style={{ position: 'absolute', top: -1, right: -1, background: '#F59E0B', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.25rem 0.75rem', borderBottomLeftRadius: '8px', borderTopRightRadius: 'var(--radius-lg)' }}>
                                    FEATURED
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <span className={`tag tag-${op.type}`}>{op.type}</span>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{op.title}</h3>
                                    <p style={{ color: 'var(--text-body)', fontWeight: '500' }}>{op.company}</p>
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                    <span>📍 {op.location}</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>View Details &rarr;</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Categories */}
            <section className="container" style={{ marginBottom: '6rem' }}>
                <div className="section-title">
                    <h2>Explore Categories</h2>
                    <p> Whatever your path, we have the right opportunity for you.</p>
                </div>
                <div className="grid grid-4">
                    {[
                        { icon: '💼', title: 'Jobs', desc: 'Full-time & Part-time roles', link: '/opportunities?type=job' },
                        { icon: '🎓', title: 'Internships', desc: 'Kickstart your career', link: '/opportunities?type=internship' },
                        { icon: '📅', title: 'Events', desc: 'Network & Learn', link: '/events' },
                        { icon: '⚡', title: 'Gigs', desc: 'Flexible short-term work', link: '/opportunities?type=gig' }
                    ].map(cat => (
                        <Link to={cat.link} key={cat.title} className="card" style={{ textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{cat.icon}</div>
                            <h4 style={{ marginBottom: '0.5rem' }}>{cat.title}</h4>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{cat.desc}</p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* CTA For Companies */}
            <section style={{ background: '#F9FAFB', borderTop: '1px solid var(--border)', padding: '6rem 0' }}>
                <div className="container" style={{ textAlign: 'center', maxWidth: '700px' }}>
                    <span style={{ textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>For Employers</span>
                    <h2 style={{ marginBottom: '1rem' }}>Hiring? Hosting an event?</h2>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-body)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                        Create a company profile to post opportunities, manage applications, and find the perfect talent for your team.
                    </p>
                    <Link to="/companies" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>Get Started for Companies</Link>
                </div>
            </section>

            {/* CONTACT / HIRE US / FEEDBACK SECTION */}
            <section style={{ padding: '6rem 0', background: 'white', borderTop: '1px solid var(--border)' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div className="section-title">
                        <h2>Have a Project or Feedback? 💌</h2>
                        <p>We'd love to hear from you. Whether you want to hire us to build a platform or just say hi.</p>
                    </div>

                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const data = Object.fromEntries(formData.entries());
                        try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL}/messages`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            });
                            if (res.ok) {
                                alert("Message sent! We'll get back to you soon.");
                                e.target.reset();
                            } else {
                                alert("Failed to send message.");
                            }
                        } catch (err) {
                            alert("Error sending message.");
                        }
                    }} style={{ background: '#F9FAFB', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'grid', gap: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Your Name *</label>
                                <input name="name" required placeholder="John Doe" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email Address *</label>
                                <input name="email" required type="email" placeholder="john@example.com" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Subject / Service</label>
                            <select name="subject" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}>
                                <option>General Feedback</option>
                                <option>I want to Hire Yenza Team (Build a Platform)</option>
                                <option>Report a Bug</option>
                                <option>Partnership Inquiry</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Message *</label>
                            <textarea name="message" required rows="5" placeholder="Tell us more..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Send Message 🚀</button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
