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
  <div className="flex bg-[#0A0A0F] min-h-screen">
    <Sidebar />
    <main className="flex-1 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
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
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard/>
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
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;