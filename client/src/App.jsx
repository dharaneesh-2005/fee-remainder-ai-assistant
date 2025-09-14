import React, { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Students from './pages/Students';
import StudentDetails from './pages/StudentDetails';
import Fees from './pages/Fees';
import Payments from './pages/Payments';
import Remind from './pages/Remind';
import Login from './pages/Login';

function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, background: '#111827', color: 'white', padding: 16 }}>
        <h3>Fee Reminder</h3>
        <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2rem' }}>
          <li><Link to="/" style={{ color: 'white' }}>Dashboard</Link></li>
          <li><Link to="/courses" style={{ color: 'white' }}>Courses</Link></li>
          <li><Link to="/students" style={{ color: 'white' }}>Students</Link></li>
          <li><Link to="/fees" style={{ color: 'white' }}>Fees</Link></li>
          <li><Link to="/payments" style={{ color: 'white' }}>Payments</Link></li>
          <li><Link to="/remind" style={{ color: 'white' }}>Remind</Link></li>
        </ul>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const requireAuth = (el) => token ? el : <Navigate to="/login" />;

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={(t)=>{localStorage.setItem('token', t); setToken(t);}} />} />
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/courses" element={requireAuth(<Layout><Courses /></Layout>)} />
      <Route path="/students" element={requireAuth(<Layout><Students /></Layout>)} />
      <Route path="/students/:id" element={requireAuth(<Layout><StudentDetails /></Layout>)} />
      <Route path="/fees" element={requireAuth(<Layout><Fees /></Layout>)} />
      <Route path="/payments" element={requireAuth(<Layout><Payments /></Layout>)} />
      <Route path="/remind" element={requireAuth(<Layout><Remind /></Layout>)} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
