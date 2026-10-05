import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { initAnalytics } from './utils/analytics';

// Layout & Core Global Components
import Header from './components/Header';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import OfflineBanner from './components/OfflineBanner';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Core Eager Pages
import Home from './pages/Home';
import PetDetail from './pages/PetDetail';

// Lazy-loaded Public Pages for High Performance
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Contact = lazy(() => import('./pages/Contact'));
const Policy = lazy(() => import('./pages/Policy'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Lazy-loaded User Protected Pages
const Account = lazy(() => import('./pages/Account'));
const Apply = lazy(() => import('./pages/Apply'));
const Profile = lazy(() => import('./pages/Profile'));

// Lazy-loaded Admin Protected Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications'));
const AdminPets = lazy(() => import('./pages/admin/AdminPets'));
const AdminAdoptions = lazy(() => import('./pages/admin/AdminAdoptions'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

export default function App() {
  useEffect(() => {
    initAnalytics();
    const handleConsentUpdate = () => initAnalytics();
    window.addEventListener('cookie_consent_updated', handleConsentUpdate);
    return () => window.removeEventListener('cookie_consent_updated', handleConsentUpdate);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <OfflineBanner />
              <Header />
              <main style={{ flex: 1 }}>
                <Suspense fallback={<LoadingScreen message="Loading page..." />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/pets/:id" element={<PetDetail />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/policy" element={<Policy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/verify/:certId" element={<VerifyCertificate />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* User Protected Routes */}
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <Account />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/apply/:petId"
                      element={
                        <ProtectedRoute>
                          <Apply />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/account/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Protected Routes */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/applications"
                      element={
                        <AdminRoute>
                          <AdminApplications />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/pets"
                      element={
                        <AdminRoute>
                          <AdminPets />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/adoptions"
                      element={
                        <AdminRoute>
                          <AdminAdoptions />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/reports"
                      element={
                        <AdminRoute>
                          <AdminReports />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <AdminRoute>
                          <AdminUsers />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <AdminRoute>
                          <AdminSettings />
                        </AdminRoute>
                      }
                    />

                    {/* 404 Fallback */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <CookieBanner />
            </div>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
