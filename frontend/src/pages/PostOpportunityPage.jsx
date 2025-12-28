import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PostOpportunityPage = () => {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Lazy Init: Check URL for type immediately
    const urlType = searchParams.get('type');

    const [step, setStep] = useState(urlType ? 2 : 1);
    const [selectedType, setSelectedType] = useState(urlType || null);
    const [submitting, setSubmitting] = useState(false);

    // Initial State
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        description: '',
        tagsString: '',
        applyLink: '',

        // --- JOB SPECIFIC (DEEP FIELDS) ---
        employmentType: 'Full-time', // Full-time, Contract, Part-time, Temporary, Internship
        locationType: 'Onsite', // Onsite, Remote, Hybrid
        category: 'Engineering', // Engineering, Design, Marketing, Sales, Product, Customer Support, Other
        responsibilities: '',
        requirements: '',
        benefits: [], // Array of strings
        salaryCurrency: 'RWF', // RWF, USD
        salaryMin: '',
        salaryMax: '',
        isSalaryDisclosed: true,

        // --- PART-TIME SPECIFIC ---
        scheduleType: 'Flexible', // Morning, Evening, Weekend, Flexible
        payType: 'Hourly', // Hourly, Daily, Weekly
        payAmount: '',
        whoCanApply: 'Anyone', // Students, Anyone
        experienceRequired: false,

        // --- INTERNSHIP SPECIFIC ---
        internshipType: 'Academic', // Academic, Industrial, Volunteer
        compensationType: 'Unpaid', // Paid, Stipend, Unpaid
        stipendAmount: '',
        hasCertificate: false,
        supervisorName: '',
        eligibility: 'Students', // Students, Graduates, Anyone
        learningOutcomes: '',

        // --- OTHER TYPES PRESERVED ---
        deadline: '',
        salaryRange: '',
        experienceLevel: 'Entry',
        duration: '',
        stipend: 'Unpaid', // Legacy, we'll sync with compensationType
        hoursPerWeek: '',
        schedule: '',
        startDate: '',
        endDate: '',
        organizer: '',
        // --- EVENT SPECIFIC ---
        eventType: 'Meetup', // Meetup, Workshop, Webinar, Conference
        registrationType: 'Free', // Free, Paid
        ticketPrice: '',
        capacity: '',
        bannerImage: '', // URL
        eventLink: '', // if online
        speakers: [], // Array of { name, role }

        // --- GIG SPECIFIC ---
        budget: '',
        deliverables: '',

        // --- PHASE 18: EXTERNAL APPLY ---
        applicationMethod: 'platform', // 'platform' or 'external'
        externalApplyUrl: '',

        // --- PHASE 19: LEARNING / COURSE ---
        learningType: 'Course', // Course, Bootcamp, Certification, Training Program
        courseProvider: '', // e.g. Coursera, ALX
        courseMode: 'Online', // Online, In-person, Hybrid
        certificateOffered: false,
        cost: 'Free', // Free, Paid
        scholarshipAvailable: false,
        skillsGained: '', // Comma separated
        enrollLink: '' // similar to externalApplyUrl but specific for learning
    });

    // Speaker Input State
    const [speakerInput, setSpeakerInput] = useState({ name: '', role: '' });

    // Helper for Benefits Checkboxes
    const benefitOptions = [
        "Health Insurance", "Remote Work", "Flexible Hours", "Paid Time Off",
        "Device/Laptop", "Learning Budget", "Gym Membership", "Free Lunch"
    ];

    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, company: user.name, organizer: user.name }));
        }
    }, [user]);

    const handleTypeSelect = (type) => {
        // --- VERIFICATION GATE ---
        // --- VERIFICATION GATE ---
        if (type === 'job' || type === 'internship' || type === 'part-time' || type === 'event' || type === 'gig' || type === 'learning') {
            const isCompany = user && !user.role;
            if (user && user.id !== 'admin-manual' && user.role !== 'admin') {
                if (!user.role && !user.isVerified) {
                    alert(`🔒 Verification Required\n\nTo post Official Opportunities, Gigs, or Courses, your company must be verified. Please complete your profile or contact support.`);
                    return;
                }
            }
        }

        setSelectedType(type);
        setStep(2);

        if (type === 'event') setFormData(prev => ({ ...prev, applyLink: '' }));
    };

    // (useEffect removed - using lazy init instead)

    const addSpeaker = () => {
        if (speakerInput.name && speakerInput.role) {
            setFormData(prev => ({ ...prev, speakers: [...prev.speakers, speakerInput] }));
            setSpeakerInput({ name: '', role: '' });
        }
    };

    const removeSpeaker = (index) => {
        setFormData(prev => ({ ...prev, speakers: prev.speakers.filter((_, i) => i !== index) }));
    };

    const toggleBenefit = (benefit) => {
        setFormData(prev => {
            const exists = prev.benefits.includes(benefit);
            if (exists) return { ...prev, benefits: prev.benefits.filter(b => b !== benefit) };
            return { ...prev, benefits: [...prev.benefits, benefit] };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const tags = formData.tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);

        // Validation for External Apply
        if (formData.applicationMethod === 'external' && !formData.externalApplyUrl) {
            alert("Please provide the External Application URL.");
            setSubmitting(false);
            return;
        }

        // Construct Salary/Comp String for Display
        let salaryString = formData.salaryRange;

        if (selectedType === 'job') {
            if (!formData.isSalaryDisclosed) {
                salaryString = "Not Disclosed";
            } else if (formData.salaryMin && formData.salaryMax) {
                salaryString = `${formData.salaryCurrency} ${Number(formData.salaryMin).toLocaleString()} - ${Number(formData.salaryMax).toLocaleString()}`;
            } else if (formData.salaryMin) {
                salaryString = `${formData.salaryCurrency} ${Number(formData.salaryMin).toLocaleString()}+`;
            }
        } else if (selectedType === 'internship') {
            if (formData.compensationType === 'Unpaid') salaryString = 'Unpaid';
            else if (formData.stipendAmount) salaryString = `${formData.salaryCurrency} ${Number(formData.stipendAmount).toLocaleString()} / month`;
            else salaryString = formData.compensationType;
        } else if (selectedType === 'part-time') {
            if (formData.payAmount) {
                salaryString = `${formData.salaryCurrency} ${Number(formData.payAmount).toLocaleString()} / ${formData.payType.replace('Hourly', 'hr').replace('Daily', 'day').replace('Weekly', 'week')}`;
            } else {
                salaryString = 'Negotiable';
            }
        } else if (selectedType === 'event') {
            salaryString = formData.registrationType === 'Free' ? 'Free' : `${formData.salaryCurrency} ${Number(formData.ticketPrice).toLocaleString()}`;
        } else if (selectedType === 'gig') {
            salaryString = `${formData.salaryCurrency} ${Number(formData.budget).toLocaleString()}`;
        } else if (selectedType === 'learning') {
            salaryString = formData.cost; // Free or Paid
        }

        const payload = {
            ...formData,
            salaryRange: salaryString,
            type: selectedType,
            tags,
            isFeatured: false,
            createdAt: new Date().toISOString(),
            status: (user && user.role === 'admin') ? 'approved' : 'pending'
        };

        if (user) {
            payload.companyId = user.id;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/opportunities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Success! Your opportunity has been posted and is pending approval.");
                if (user) navigate('/dashboard');
                else navigate('/opportunities');
            } else {
                alert("Something went wrong.");
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to server.");
        } finally {
            setSubmitting(false);
        }
    };

    // ... [Rest of RenderTypeCard and RenderStep1 Same]

    const renderTypeCard = (id, title, desc, icon) => (
        <div
            onClick={() => handleTypeSelect(id)}
            style={{
                background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', boxShadow: 'var(--shadow-sm)'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>{title}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{desc}</p>
        </div>
    );

    const renderStep1 = () => (
        <div className="container" style={{ padding: '4rem 24px', maxWidth: '1000px' }}>
            <div className="section-title">
                <h2>What are you posting?</h2>
                <p>Choose the category that best fits your opportunity.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {renderTypeCard('job', 'Full-Time Job', 'Find long-term professional talent.', '💼')}
                {renderTypeCard('internship', 'Internship', 'Mentor the next generation of talent.', '🎓')}
                {renderTypeCard('part-time', 'Part-Time', 'Flexible hours for flexible workers.', '⏳')}
                {renderTypeCard('event', 'Event / Workshop', 'Webinars, meetups, and training sessions.', '📅')}
                {renderTypeCard('gig', 'Gig / Micro-task', 'One-off tasks with fixed budgets.', '⚡')}
                {renderTypeCard('learning', 'Learning / Course', 'Courses, Bootcamps, and Certificates.', '📚')}
            </div>
            {user && !user.isVerified && !user.role && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: '#FEF3C7', color: '#B45309', borderRadius: '8px', textAlign: 'center' }}>
                    🔒 <strong>Note constraint:</strong> Unverified companies cannot post Official Jobs, Internships, or Part-Time roles until verified.
                </div>
            )}
        </div>
    );

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSubmitting(true); // Reuse submitting state or add specific one
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result;
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileBase64: base64 })
                });
                const data = await res.json();
                if (data.url) {
                    setFormData(prev => ({ ...prev, bannerImage: data.url }));
                } else {
                    alert('Upload failed');
                }
            } catch (err) {
                console.error(err);
                alert('Error uploading image');
            } finally {
                setSubmitting(false);
            }
        };
    };

    const renderStep2 = () => (
        <div className="container" style={{ padding: '4rem 24px', maxWidth: '800px' }}>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', marginBottom: '1rem', cursor: 'pointer', color: 'var(--text-light)' }}>← Back to Types</button>
            <div className="section-title" style={{ textAlign: 'left' }}>
                <h2>Post a <span style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{selectedType === 'gig' ? 'Gig' : selectedType}</span></h2>
                <p>Fill in the details below. Fields marked * are required.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gap: '1.5rem' }}>

                {/* 1. CORE INFO */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Title *</label>
                        <input className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder={selectedType === 'gig' ? "e.g. Logo Design" : "e.g. Marketing Assistant"} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{selectedType === 'event' ? 'Organizer' : selectedType === 'learning' ? 'Provider / Organization' : 'Company'}</label>
                        <input className="input" value={selectedType === 'event' ? formData.organizer : selectedType === 'learning' ? formData.courseProvider : formData.company} onChange={e => setFormData({ ...formData, [selectedType === 'event' ? 'organizer' : selectedType === 'learning' ? 'courseProvider' : 'company']: e.target.value })} disabled={!!user && user.role !== 'admin'} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', background: (user && user.role !== 'admin') ? '#f3f4f6' : 'white' }} />
                    </div>
                </div>

                {/* 2. APPLICATION METHOD TOGGLE (PHASE 18) */}
                <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold' }}>How should talents apply?</label>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, applicationMethod: 'platform' })}
                            style={{
                                flex: 1, padding: '1rem', borderRadius: '8px', border: formData.applicationMethod === 'platform' ? '2px solid var(--primary)' : '1px solid #d1d5db',
                                background: formData.applicationMethod === 'platform' ? '#EEF2FF' : 'white', color: formData.applicationMethod === 'platform' ? 'var(--primary)' : '#374151',
                                fontWeight: '600', cursor: 'pointer', textAlign: 'center'
                            }}
                        >
                            📱 Apply on Platform
                            <div style={{ fontSize: '0.8rem', fontWeight: '400', marginTop: '4px' }}>Recommended for easy tracking</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, applicationMethod: 'external' })}
                            style={{
                                flex: 1, padding: '1rem', borderRadius: '8px', border: formData.applicationMethod === 'external' ? '2px solid var(--primary)' : '1px solid #d1d5db',
                                background: formData.applicationMethod === 'external' ? '#EEF2FF' : 'white', color: formData.applicationMethod === 'external' ? 'var(--primary)' : '#374151',
                                fontWeight: '600', cursor: 'pointer', textAlign: 'center'
                            }}
                        >
                            🔗 External Website
                            <div style={{ fontSize: '0.8rem', fontWeight: '400', marginTop: '4px' }}>Redirect to ATS or Career Page</div>
                        </button>
                    </div>

                    {formData.applicationMethod === 'external' ? (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>External Application URL *</label>
                            <input
                                type="url"
                                className="input"

                                placeholder="https://company.com/careers/job123"
                                value={formData.externalApplyUrl}
                                onChange={e => setFormData({ ...formData, externalApplyUrl: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            />
                            <div style={{ fontSize: '0.85rem', color: '#B45309', marginTop: '0.5rem', background: '#FEF3C7', padding: '0.5rem', borderRadius: '6px' }}>
                                ⚠️ <strong>Note:</strong> Applicants will be warned they are leaving the platform. Ensure this link is secure (HTTPS).
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Application Notification Email (Optional)</label>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>We'll notify this email when someone applies on the platform.</p>
                            <input className="input" disabled placeholder="Sent to account email by default" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f3f4f6' }} />
                        </div>
                    )}
                </div>

                {/* --- PART-TIME SPECIFIC FORM --- */}
                {selectedType === 'part-time' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Job Category</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Retail / Sales</option>
                                    <option>Delivery / Logistics</option>
                                    <option>Teaching / Tutoring</option>
                                    <option>Customer Support</option>
                                    <option>Hospitality</option>
                                    <option>Tech / IT</option>
                                    <option>Marketing / Admin</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location Type</label>
                                <select value={formData.locationType} onChange={e => setFormData({ ...formData, locationType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Onsite</option>
                                    <option>Remote</option>
                                    <option>Hybrid</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                            <h4 style={{ marginBottom: '1rem', color: '#166534' }}>⏱ Time & Schedule (Crucial)</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Hours per Week</label>
                                    <input className="input" value={formData.hoursPerWeek} onChange={e => setFormData({ ...formData, hoursPerWeek: e.target.value })} placeholder="e.g. 10-20 hrs" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Schedule Type</label>
                                    <select value={formData.scheduleType} onChange={e => setFormData({ ...formData, scheduleType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                        <option>Morning Shift</option>
                                        <option>Evening Shift</option>
                                        <option>Weekend Only</option>
                                        <option>Flexible</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <h4 style={{ marginBottom: '1rem' }}>💰 Compensation</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Currency</label>
                                    <select value={formData.salaryCurrency} onChange={e => setFormData({ ...formData, salaryCurrency: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                        <option>RWF</option>
                                        <option>USD</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Pay Type</label>
                                    <select value={formData.payType} onChange={e => setFormData({ ...formData, payType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                        <option>Hourly</option>
                                        <option>Daily</option>
                                        <option>Weekly</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Amount</label>
                                    <input type="number" value={formData.payAmount} onChange={e => setFormData({ ...formData, payAmount: e.target.value })} placeholder="e.g. 5000" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Who can apply?</label>
                                <select value={formData.whoCanApply} onChange={e => setFormData({ ...formData, whoCanApply: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Anyone</option>
                                    <option>Students</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.8rem' }}>
                                <input type="checkbox" checked={formData.experienceRequired} onChange={e => setFormData({ ...formData, experienceRequired: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                <label style={{ fontWeight: '500' }}>Experience Required?</label>
                            </div>
                        </div>
                    </>
                )}
                {/* --- JOB SPECIFIC --- */}
                {selectedType === 'job' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Employment Type</label>
                                <select value={formData.employmentType} onChange={e => setFormData({ ...formData, employmentType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Full-time</option>
                                    <option>Contract</option>
                                    <option>Temporary</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location Type</label>
                                <select value={formData.locationType} onChange={e => setFormData({ ...formData, locationType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Onsite</option>
                                    <option>Remote</option>
                                    <option>Hybrid</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Levels</label>
                                <select value={formData.experienceLevel} onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Entry Level</option>
                                    <option>Mid Level</option>
                                    <option>Senior Level</option>
                                    <option>Manager</option>
                                    <option>Director</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Job Category</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Engineering</option>
                                    <option>Design</option>
                                    <option>Product Management</option>
                                    {/* ... add more if needed */}
                                    <option>Marketing</option>
                                    <option>Sales</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {/* --- INTERNSHIP SPECIFIC --- */}
                {selectedType === 'internship' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Internship Type</label>
                                <select value={formData.internshipType} onChange={e => setFormData({ ...formData, internshipType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Academic</option>
                                    <option>Industrial</option>
                                    <option>Volunteer</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Eligibility</label>
                                <select value={formData.eligibility} onChange={e => setFormData({ ...formData, eligibility: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Students</option>
                                    <option>Fresh Graduates</option>
                                    <option>Anyone</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location Type</label>
                                <select value={formData.locationType} onChange={e => setFormData({ ...formData, locationType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Onsite</option>
                                    <option>Remote</option>
                                    <option>Hybrid</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Duration</label>
                                <input className="input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 3 Months" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date</label>
                                <input type="date" className="input" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                            </div>
                        </div>

                        <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Compensation</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Type</label>
                                    <select value={formData.compensationType} onChange={e => setFormData({ ...formData, compensationType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                        <option>Unpaid</option>
                                        <option>Paid</option>
                                        <option>Stipend</option>
                                    </select>
                                </div>
                                {formData.compensationType !== 'Unpaid' && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Amount ({formData.salaryCurrency})</label>
                                        <input type="number" value={formData.stipendAmount} onChange={e => setFormData({ ...formData, stipendAmount: e.target.value })} placeholder="e.g. 100000" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                            <input type="checkbox" checked={formData.hasCertificate} onChange={e => setFormData({ ...formData, hasCertificate: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                            <label style={{ fontWeight: '500' }}>Certificate Offered upon completion?</label>
                        </div>
                    </>
                )}

                {/* --- PART-TIME SPECIFIC --- */}
                {selectedType === 'part-time' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Hours / Week</label>
                            <input className="input" value={formData.hoursPerWeek} onChange={e => setFormData({ ...formData, hoursPerWeek: e.target.value })} placeholder="e.g. 20 hrs" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Schedule</label>
                            <input className="input" value={formData.schedule} onChange={e => setFormData({ ...formData, schedule: e.target.value })} placeholder="e.g. Mornings, Weekends" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                        </div>
                    </div>
                )}

                {/* --- EVENT SPECIFIC --- */}
                {selectedType === 'event' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Event Type</label>
                                <select value={formData.eventType} onChange={e => setFormData({ ...formData, eventType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Meetup</option>
                                    <option>Workshop</option>
                                    <option>Webinar</option>
                                    <option>Conference</option>
                                    <option>Training</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location Type</label>
                                <select value={formData.locationType} onChange={e => setFormData({ ...formData, locationType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>In-Person</option>
                                    <option>Online</option>
                                    <option>Hybrid</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Banner Image (Upload)</label>
                            <input
                                className="input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            />
                            {formData.bannerImage && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'green', marginBottom: '0.5rem' }}>✓ Image Selected</p>
                                    <img src={formData.bannerImage} alt="Banner Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                </div>
                            )}
                        </div>

                        <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                            <h4 style={{ marginBottom: '1rem', color: '#1e40af' }}>📅 Date & Time</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date & Time</label>
                                    <input type="datetime-local" className="input" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date & Time</label>
                                    <input type="datetime-local" className="input" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                </div>
                            </div>
                        </div>

                        {/* Location Details */}
                        {formData.locationType !== 'In-Person' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Online Meeting Link (Zoom/Meet)</label>
                                <input className="input" value={formData.eventLink} onChange={e => setFormData({ ...formData, eventLink: e.target.value })} placeholder="https://zoom.us/..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                            </div>
                        )}

                        {/* Registration & Speakers */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Registration</label>
                                <select value={formData.registrationType} onChange={e => setFormData({ ...formData, registrationType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                    <option>Free</option>
                                    <option>Paid</option>
                                </select>
                            </div>
                            {formData.registrationType === 'Paid' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Ticket Price ({formData.salaryCurrency})</label>
                                    <input type="number" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} placeholder="5000" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                </div>
                            )}
                        </div>

                        <div style={{ background: '#fdf2f8', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
                            <h4 style={{ marginBottom: '1rem', color: '#9d174d' }}>🎙 Speakers</h4>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input placeholder="Name" value={speakerInput.name} onChange={e => setSpeakerInput({ ...speakerInput, name: e.target.value })} style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                                <input placeholder="Role/Title" value={speakerInput.role} onChange={e => setSpeakerInput({ ...speakerInput, role: e.target.value })} style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                                <button type="button" onClick={addSpeaker} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                            </div>

                            {formData.speakers.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {formData.speakers.map((s, i) => (
                                        <span key={i} style={{ background: 'white', border: '1px solid #fbcfe8', padding: '4px 8px', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            👤 <strong>{s.name}</strong> <span style={{ fontSize: '0.8rem', color: '#666' }}>({s.role})</span>
                                            <button type="button" onClick={() => removeSpeaker(i)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}




                {/* --- LEARNING SPECIFIC --- */}
                {
                    selectedType === 'learning' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Learning Type</label>
                                    <select value={formData.learningType} onChange={e => setFormData({ ...formData, learningType: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                        <option>Course</option>
                                        <option>Bootcamp</option>
                                        <option>Certification</option>
                                        <option>Training Program</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Mode</label>
                                    <select value={formData.courseMode} onChange={e => setFormData({ ...formData, courseMode: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                        <option>Online</option>
                                        <option>In-person</option>
                                        <option>Hybrid</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Cost</label>
                                    <select value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                        <option>Free</option>
                                        <option>Paid</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Duration</label>
                                    <input className="input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 6 Weeks" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Level (Optional)</label>
                                    <select value={formData.experienceLevel} onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                        <option>All Levels</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', background: '#F0F9FF', padding: '1.5rem', borderRadius: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.certificateOffered} onChange={e => setFormData({ ...formData, certificateOffered: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                    <span style={{ fontWeight: '500' }}>Certificate Offered? 📜</span>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.scholarshipAvailable} onChange={e => setFormData({ ...formData, scholarshipAvailable: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                    <span style={{ fontWeight: '500' }}>Scholarships Available? 🎓</span>
                                </label>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Skills Gained (Optional)</label>
                                <input className="input" value={formData.skillsGained} onChange={e => setFormData({ ...formData, skillsGained: e.target.value })} placeholder="e.g. React, UI Design, Project Management" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Enroll / Apply Link *</label>
                                <input type="url" className="input" value={formData.enrollLink} onChange={e => setFormData({ ...formData, enrollLink: e.target.value })} placeholder="https://..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                                <div style={{ fontSize: '0.85rem', color: '#B45309', marginTop: '0.5rem', background: '#FEF3C7', padding: '0.5rem', borderRadius: '6px' }}>
                                    🔗 <strong>Learning Posts Redirect:</strong> This button will say "Enroll on Provider Site".
                                </div>
                            </div>
                        </>
                    )
                }


                {/* 3. COMMON FIELDS & DEEP FIELDS (Location, Desc, Link, Deadline) */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location (City/Area)</label>
                    <input className="input" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Remote, Kigali, etc." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description (Introduction) *</label>
                    <textarea className="input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={5} placeholder="General overview of the role or opportunity..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}></textarea>
                </div>

                {/* --- JOB DEEP FIELDS --- */}
                {
                    selectedType === 'job' && (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Key Responsibilities</label>
                                <textarea className="input" value={formData.responsibilities} onChange={e => setFormData({ ...formData, responsibilities: e.target.value })} rows={4} placeholder="- Lead the design team..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}></textarea>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Requirements / Qualifications</label>
                                <textarea className="input" value={formData.requirements} onChange={e => setFormData({ ...formData, requirements: e.target.value })} rows={4} placeholder="- 5+ years of experience..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}></textarea>
                            </div>

                            {/* Benefits */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Benefits & Perks</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                                    {benefitOptions.map(b => (
                                        <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.benefits.includes(b)} onChange={() => toggleBenefit(b)} />
                                            {b}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Salary */}
                            <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', marginBottom: '1rem' }}>
                                    <input type="checkbox" checked={formData.isSalaryDisclosed} onChange={e => setFormData({ ...formData, isSalaryDisclosed: e.target.checked })} />
                                    Disclose Salary? (Highly Recommended)
                                </label>
                                {formData.isSalaryDisclosed && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-light)' }}>Currency</label>
                                            <select value={formData.salaryCurrency} onChange={e => setFormData({ ...formData, salaryCurrency: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                                                <option>RWF</option>
                                                <option>USD</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-light)' }}>Min</label>
                                            <input type="number" value={formData.salaryMin} onChange={e => setFormData({ ...formData, salaryMin: e.target.value })} placeholder="e.g. 500000" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-light)' }}>Max (Optional)</label>
                                            <input type="number" value={formData.salaryMax} onChange={e => setFormData({ ...formData, salaryMax: e.target.value })} placeholder="e.g. 1000000" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )
                }

                {/* --- INTERNSHIP LEARNING OUTCOMES (REQUIRED) --- */}
                {
                    selectedType === 'internship' && (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Learning Outcomes (What will they learn?) *</label>
                                <textarea className="input" value={formData.learningOutcomes} onChange={e => setFormData({ ...formData, learningOutcomes: e.target.value })} rows={4} placeholder="- Practical experience with React..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}></textarea>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Required Skills / Basics *</label>
                                <textarea className="input" value={formData.requirements} onChange={e => setFormData({ ...formData, requirements: e.target.value })} rows={3} placeholder="- Basic JavaScript knowledge..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}></textarea>
                            </div>
                        </>
                    )
                }

                {/* Deadline & Link (Common) */}
                {
                    selectedType !== 'event' && selectedType !== 'learning' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Application Method / Link</label>
                                <input className="input" value={formData.applyLink} onChange={e => setFormData({ ...formData, applyLink: e.target.value })} placeholder="e.g. https://... or mailto:..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Deadline</label>
                                <input type="date" className="input" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                            </div>
                        </div>
                    )
                }

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tags</label>
                    <input className="input" value={formData.tagsString} onChange={e => setFormData({ ...formData, tagsString: e.target.value })} placeholder="e.g. Design, React, Urgent (comma separated)" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <button type="submit" disabled={submitting} style={{ width: '100%', padding: '1rem', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '1rem', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        {submitting ? 'Posting...' : 'Post Opportunity'}
                    </button>
                    {(selectedType === 'job' || selectedType === 'internship') && !user?.isVerified && user?.id !== 'admin-manual' && (
                        <p style={{ marginTop: '1rem', color: '#B45309', fontSize: '0.9rem', textAlign: 'center' }}>⚠️ You are posting as an Unverified Company. Your post will require strict approval.</p>
                    )}
                </div>

            </form >
        </div >
    );

    if (!user) {
        return (
            <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Login Required</h2>
                <p style={{ color: 'var(--text-light)', marginBottom: '2rem', fontSize: '1.1rem' }}>You must be logged in to post an opportunity.</p>
                <button onClick={() => navigate('/user/login')} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>Login Now</button>
            </div>
        );
    }

    return step === 1 ? renderStep1() : renderStep2();
};

export default PostOpportunityPage;
