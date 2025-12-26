import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailsPage from './pages/OpportunityDetailsPage';
import PostOpportunityPage from './pages/PostOpportunityPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AuthSelectionPage from './pages/AuthSelectionPage'; // Imported Correctly

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CompanyDashboard from './pages/CompanyDashboard';
import { AuthProvider } from './context/AuthContext';

import UserLoginPage from './pages/UserLoginPage';
import UserSignupPage from './pages/UserSignupPage';
import UserProfilePage from './pages/UserProfilePage';

import EventsPage from './pages/EventsPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/opportunities/:id" element={<OpportunityDetailsPage />} />
            <Route path="/post" element={<PostOpportunityPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/companies/:id" element={<CompanyProfilePage />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Auth Selection */}
            <Route path="/login" element={<AuthSelectionPage />} />
            <Route path="/signup" element={<AuthSelectionPage />} />

            {/* Company Auth */}
            <Route path="/company/login" element={<LoginPage />} />
            <Route path="/company/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<CompanyDashboard />} />

            {/* User Auth */}
            <Route path="/user/login" element={<UserLoginPage />} />
            <Route path="/user/signup" element={<UserSignupPage />} />
            <Route path="/profile" element={<UserProfilePage />} />

            {/* Content Pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
