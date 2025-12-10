import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import QuickDraw from './pages/QuickDraw'
import ConfigureJobBoards from './pages/ConfigureJobBoards'
import ConfigureCompanies from './pages/ConfigureCompanies'

function App() {
  const { loading } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/', element: <Home />, type: 'public' },
    { name: 'Login', path: '/login', element: <Login />, type: 'public', restricted: true },
    { name: 'My Profile', path: '/myprofile', element: <MyProfile />, type: 'private' },
    { name: 'Create User', path: '/createuser', element: <CreateUser />, type: 'public', restricted: true },
    { name: 'Change Password', path: '/changepassword', element: <ChangePassword />, type: 'private' },
    { name: 'Enter Application', path: '/enterapplication', element: <EnterApplication />, type: 'private' },
    { name: 'Quick Draw', path: '/quickdraw', element: <QuickDraw />, type: 'private' },
    { name: 'Cover Letters', path: '/coverletters', element: <CoverLetters/>, type: 'private' },
    { name: 'Configure Job Boards', path: '/configurejobboards', element: <ConfigureJobBoards/>, type: 'private' },
    { name: 'Configure Companies', path: '/configurecompanies', element: <ConfigureCompanies/>, type: 'private' },
  ];

  if (loading) return <p>Loading...</p>;

  return (
    <BrowserRouter>
      <Navbar links={navLinks} />
      <div>
        <Routes>
          {navLinks.map((link) => {
            let wrappedElement = link.element;

            if (link.type === 'private') {
              wrappedElement = <PrivateRoute>{link.element}</PrivateRoute>;
            } else if (link.type === 'public' && link.restricted) {
              wrappedElement = <PublicRoute restricted>{link.element}</PublicRoute>;
            }

            return <Route key={link.path} path={link.path} element={wrappedElement} />;
          })}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
