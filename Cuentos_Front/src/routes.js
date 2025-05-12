import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/pages/HomePage';
import Login from './components/Login';
import Register from './components/Register';
import Subscribe from './components/Subscribe';
import Profile from './components/Profile';
import AboutPage from './components/pages/AboutPage';
import ServicesPage from './components/pages/ServicesPage';
import ContactPage from './components/pages/ContactPage';
import TerminosPage from './components/pages/TerminosPage';
import PoliticaPage from './components/pages/PoliticaPage';
import ComoFuncionaPage from './components/pages/ComoFuncionaPage';
import GoogleCallback from './components/GoogleCallback';
import { useAuth } from './contexts/AuthContext';

// Componente wrapper para rutas privadas usando el hook useAuth
const PrivateRouteWrapper = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Si está cargando pero hay un token, mostrar el contenido de todos modos y actualizar en segundo plano
  if (isLoading && localStorage.getItem('token')) {
    return children;
  }
  
  // Si no está cargando y no está autenticado, redireccionar
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Si está autenticado o está en proceso de verificación, mostrar contenido
  return children;
};

// Componente wrapper para rutas públicas usando el hook useAuth
const PublicRouteWrapper = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Si está cargando pero no hay token, mostrar el contenido de todos modos y actualizar en segundo plano
  if (isLoading && !localStorage.getItem('token')) {
    return children;
  }
  
  // Si no está cargando y está autenticado, redireccionar
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  // Si no está autenticado o está en proceso de verificación, mostrar contenido
  return children;
};

// Componentes de ruta que usan los wrappers
const PrivateRoute = ({ children }) => <PrivateRouteWrapper>{children}</PrivateRouteWrapper>;
const PublicRoute = ({ children }) => <PublicRouteWrapper>{children}</PublicRouteWrapper>;

const AppRoutes = () => {
  return (
    <div className="app">
      <Toaster position="top-right" />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terminos" element={<TerminosPage />} />
          <Route path="/politica" element={<PoliticaPage />} />
          <Route path="/como-funciona" element={<ComoFuncionaPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/subscribe" element={
            <PrivateRoute>
              <Subscribe />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default AppRoutes;