import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import OnboardingModal from '../auth/OnboardingModal';

const Layout = ({ children }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <OnboardingModal />
            <main style={{ flex: 1 }}>
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
