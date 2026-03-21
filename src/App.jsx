import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import OrderHistory from './pages/OrderHistory.jsx';
import Login from './components/auth/Login.jsx';
import Logout from './components/auth/Logout.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProfileModal from './components/auth/ProfileModal'; // Global Modal
import AdminSettings from './pages/AdminSettings.jsx';
import AdminPlatform from './pages/AdminPlatform.jsx';

import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import { AuthProvider } from './context/AuthContext';

import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuth } from './context/AuthContext';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import UpdateManager from './components/common/UpdateManager';

const GlobalProfileModalWrapper = () => {
  const { isProfileModalOpen, closeProfileModal, user } = useAuth();
  return (
    <ProfileModal
      isOpen={isProfileModalOpen}
      onClose={closeProfileModal}
      user={user}
    />
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <OrderProvider>
              <Routes>
                {/* Public Store Layout */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/produto/:id" element={<ProductDetail />} />
                  <Route path="/orders" element={
                    <ProtectedRoute>
                      <OrderHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={<Login />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                {/* Admin Layout */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Admin />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminUsers />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <AdminSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="platform" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <AdminPlatform />
                    </ProtectedRoute>
                  } />
                </Route>
              </Routes>

              {/* Global Modals */}
              <GlobalProfileModalWrapper />

              {/* PWA Install Custom Banner */}
              <PWAInstallPrompt />

              {/* Background Auto-Update Manager */}
              <UpdateManager />

            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
