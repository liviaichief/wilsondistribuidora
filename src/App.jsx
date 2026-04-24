import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminFinance from './pages/AdminFinance.jsx';
import AdminBanners from './pages/AdminBanners.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminCatalog from './pages/AdminCatalog.jsx';
import { getSettings } from './services/dataService';

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

const GoogleTagManagerLoader = () => {
  React.useEffect(() => {
    getSettings().then(settings => {
      if (settings.google_gtm_id) {
        const gtmId = settings.google_gtm_id;
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer',gtmId);
      }
    });
  }, []);
  return null;
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
                
                {/* Fallback para rotas inexistentes (evita tela em branco e becos sem saída) */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Global Modals */}
              <GlobalProfileModalWrapper />

              {/* PWA Install Custom Banner */}
              <PWAInstallPrompt />

              {/* Background Auto-Update Manager */}
              <UpdateManager />

              {/* Google Tag Manager Dynamic Loader */}
              <GoogleTagManagerLoader />

            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
