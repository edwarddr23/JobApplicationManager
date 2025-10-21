import React from 'react';
import logo from './logo.svg';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Explore from './pages/Explore';
import Login from './pages/Login';
import { useAuth } from './contexts/AuthContext';
import MyProfile from './pages/MyProfile';
import CreateUser from './pages/CreateUser';
import ChangePassword from './pages/ChangePassword';

function App() {
  const { loading } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/', element: <Home/> },
    { name: 'Explore', path: '/explore', element: <Explore/> },
    { name: 'Login', path: '/login', element: <Login/> },
    { name: 'My Profile', path: '/myprofile', element: <MyProfile/> },
    { name: 'Create User', path: '/createuser', element: <CreateUser/> },
    { name: 'Change Password', path: '/changepassword', element: <ChangePassword/> },
  ]

  if(loading) return <p>Loading...</p>

  return (
    <div>
      <BrowserRouter>
      <Navbar links={navLinks}/>
        <div>
          <Routes>
            {navLinks.map((link) => (<Route path={link.path} element={link.element}/>))}
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  )
}

export default App;
