import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import About from './pages/About';
import AdminNews from './pages/AdminNews';
import ContactDetails from './pages/ContactDetails';
import Lands from './pages/Lands';
import ProjectsDetails from './pages/ProjectsDetails';
import ProjectsInquiries from './pages/ProjectsInquiries';
import GallaryManage from './pages/GallaryManage';
import MetaDetails from './pages/MetaDetails';

// Simple types for Page components
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex bg-slate-50 min-h-screen">
    <Sidebar />
    <main className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </main>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<h1 className="text-2xl font-bold">Dashboard Home</h1>} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<ContactDetails />} />
          <Route path="/news" element={<AdminNews />} />
          <Route path="/land" element={<Lands />} />
          <Route path="/projects" element={<ProjectsDetails />} />
          <Route path="/projects-inquiries" element={<ProjectsInquiries />} />
          <Route path="/gallery" element={<GallaryManage />} />
          <Route path="/meta" element={<MetaDetails />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;