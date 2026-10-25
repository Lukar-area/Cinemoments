import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { HomePage } from './pages/HomePage.js';
import { TheatresPage } from './pages/TheatresPage.js';
import { TheatreDetailPage } from './pages/TheatreDetailPage.js';
import { MoviesPage } from './pages/MoviesPage.js';
import { BookingWizardPage } from './pages/BookingWizardPage.js';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage.js';
import { StaffDashboardPage } from './pages/StaffDashboardPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
export const App = () => {
    return (<AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-cinema-900 text-slate-100 selection:bg-cinema-gold selection:text-black">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Browsing Routes */}
                <Route path="/" element={<HomePage />}/>
                <Route path="/theatres" element={<TheatresPage />}/>
                <Route path="/theatres/:id" element={<TheatreDetailPage />}/>
                <Route path="/movies" element={<MoviesPage />}/>
                <Route path="/login" element={<LoginPage />}/>
                <Route path="/register" element={<RegisterPage />}/>

                {/* Booking & Customer Protected Routes */}
                <Route path="/book" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                      <BookingWizardPage />
                    </ProtectedRoute>}/>
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CustomerDashboardPage />
                    </ProtectedRoute>}/>

                {/* Staff Protected Routes */}
                <Route path="/staff" element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                      <StaffDashboardPage />
                    </ProtectedRoute>}/>

                {/* Super Admin Protected Routes */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>}/>

                {/* Fallback 404 */}
                <Route path="*" element={<div className="py-24 text-center">
                      <h2 className="text-3xl font-bold text-white">404 - Page Not Found</h2>
                      <p className="text-slate-400 mt-2">The page you requested does not exist.</p>
                    </div>}/>
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>);
};
export default App;
