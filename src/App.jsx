import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import OrderHistory from './pages/OrderHistory';
import Login from './components/auth/Login';
import Logout from './components/auth/Logout';
import ProductDetail from './pages/ProductDetail';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProfileModal from './components/auth/ProfileModal';
import AdminSettings from './pages/AdminSettings';
import AdminFinance from './pages/AdminFinance';
import AdminBanners from './pages/AdminBanners';
import AdminOrders from './pages/AdminOrders';
import AdminCatalog from './pages/AdminCatalog';

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
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <AdminUsers />
                    </ProtectedRoute>
                  } />
                  <Route path="banners" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <AdminBanners />
                    </ProtectedRoute>
                  } />
                  <Route path="catalogo" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <AdminCatalog />
                    </ProtectedRoute>
                  } />
                  <Route path="pedidos" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <AdminOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <AdminSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="financeiro" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <AdminFinance />
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
