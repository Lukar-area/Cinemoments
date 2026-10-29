import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { TheatresPage } from './pages/TheatresPage.jsx';
import { TheatreDetailPage } from './pages/TheatreDetailPage.jsx';
import { MoviesPage } from './pages/MoviesPage.jsx';
import { BookingWizardPage } from './pages/BookingWizardPage.jsx';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage.jsx';
import { StaffDashboardPage } from './pages/StaffDashboardPage.jsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';

export const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#FAFAFE] text-[#301934] selection:bg-[#9F2B68] selection:text-white film-grain relative">
            <Navbar />
            <main className="flex-1 relative z-10">
              <Routes>
                {/* Public Browsing Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/theatres" element={<TheatresPage />} />
                <Route path="/theatres/:id" element={<TheatreDetailPage />} />
                <Route path="/movies" element={<MoviesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Booking & Customer Protected Routes */}
                <Route
                  path="/book"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                      <BookingWizardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CustomerDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Staff Protected Routes */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                      <StaffDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Super Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback 404 */}
                <Route
                  path="*"
                  element={
                    <div className="py-24 text-center">
                      <h2 className="text-3xl font-bold text-[#301934] font-cinema">404 - Curtain Call</h2>
                      <p className="text-[#915F6D] mt-2 font-mono">The scene you requested does not exist in this screening.</p>
                    </div>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
