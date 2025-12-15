import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import MyProfile from './pages/MyProfile';
import CreateUser from './pages/CreateUser';
import ChangePassword from './pages/ChangePassword';
import EnterApplication from './pages/EnterApplication';
import { PrivateRoute, PublicRoute } from './routehandling/RouteHandling';
import CoverLetters from './pages/CoverLetters';
import QuickDraw from './pages/QuickDraw';
import ConfigureJobBoards from './pages/ConfigureJobBoards';
import ConfigureCompanies from './pages/ConfigureCompanies';

function App() {
  const { loading, user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/', element: <Home />, type: 'public' },
    { name: 'Login', path: '/login', element: <Login />, type: 'public', restricted: true },
    { name: 'My Profile', path: '/myprofile', element: <MyProfile />, type: 'private' },
    { name: 'Create User', path: '/createuser', element: <CreateUser />, type: 'public', restricted: true },
    { name: 'Change Password', path: '/changepassword', element: <ChangePassword />, type: 'private' },
    { name: 'Enter Application', path: '/enterapplication', element: <EnterApplication />, type: 'private' },
    { name: 'Quick Draw', path: '/quickdraw', element: <QuickDraw />, type: 'private' },
    { name: 'Cover Letters', path: '/coverletters', element: <CoverLetters />, type: 'private' },
    { name: 'Configure Job Boards', path: '/configurejobboards', element: <ConfigureJobBoards />, type: 'private' },
    { name: 'Configure Companies', path: '/configurecompanies', element: <ConfigureCompanies />, type: 'private' },
  ];

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* ===========================
          Sidebar (fixed)
      ============================ */}
      <aside
        style={{
          width: 250,
          backgroundColor: '#f4f4f4',
          borderRight: '1px solid #ddd',
          padding: '20px 10px',
          overflowY: 'auto',
          position: 'fixed',
          top: 60,          // below the top bar
          bottom: 0,
        }}
      >
        <Navbar links={navLinks} />
      </aside>

      {/* ===========================
          Main area
      ============================ */}
      <div style={{ flex: 1, marginLeft: 250, display: 'flex', flexDirection: 'column' }}>
        
        {/* ---------- Fixed Top Bar ---------- */}
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 250,
            right: 0,
            height: 60,
            backgroundColor: '#fff',
            borderBottom: '1px solid #ddd',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '1.4rem',
            fontWeight: 600,
            zIndex: 1000
          }}
        >
          <span>Job Application Manager</span>

          {/* Login or Logout button */}
          <button
            onClick={() => {
              if (user) {
                logout();
                navigate('/login');
              } else {
                navigate('/login');
              }
            }}
            style={{
              padding: '6px 14px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            {user ? 'Logout' : 'Login'}
          </button>
        </header>

        {/* ---------- Scrollable Page Content ---------- */}
        <main
          style={{
            flex: 1,
            marginTop: 60,     // below top bar
            padding: 20,
            overflowY: 'auto',
            height: 'calc(100vh - 60px)'
          }}
        >
          <Routes>
            {navLinks.map((link) => {
              let wrappedElement = link.element;

              if (link.type === 'private') {
                wrappedElement = <PrivateRoute>{link.element}</PrivateRoute>;
              } else if (link.type === 'public' && link.restricted) {
                wrappedElement = <PublicRoute restricted>{link.element}</PublicRoute>;
              }

              return (
                <Route
                  key={link.path}
                  path={link.path}
                  element={wrappedElement}
                />
              );
            })}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
