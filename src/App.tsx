// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import About from './pages/About';
import AdminNews from './pages/AdminNews';
import ContactDetails from './pages/ContactDetails';
import Lands from './pages/Lands';
import ProjectsDetails from './pages/ProjectsDetails';
import ProjectsInquiries from './pages/ProjectsInquiries';
import GallaryManage from './pages/GallaryManage';
import MetaDetails from './pages/MetaDetails';
import Dashboard from './pages/Dashboard';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <main className="flex-1 transition-all duration-300">
      <div className="p-6 lg:p-8">
        {children}
      </div>
    </main>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <Layout>
                  <About />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <Layout>
                  <ContactDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminNews />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/land"
            element={
              <ProtectedRoute>
                <Layout>
                  <Lands />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectsDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/projects-inquiries"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectsInquiries />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <Layout>
                  <GallaryManage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/meta"
            element={
              <ProtectedRoute>
                <Layout>
                  <MetaDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* 404 Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;