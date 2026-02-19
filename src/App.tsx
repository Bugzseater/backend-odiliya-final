import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import About from './pages/About';
import AdminNews from './pages/AdminNews';
import ContactDetails from './pages/ContactDetails';

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
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;