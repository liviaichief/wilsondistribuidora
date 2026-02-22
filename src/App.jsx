import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import OrderHistory from './pages/OrderHistory.jsx';
import Login from './components/Login.jsx';
import Logout from './components/Logout.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileModal from './components/ProfileModal'; // Global Modal

import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import { AuthProvider } from './context/AuthContext';

import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';

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
                </Route>
              </Routes>

              {/* Global Modals */}
              <GlobalProfileModalWrapper />

            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
