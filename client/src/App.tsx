import React from 'react';
import logo from './logo.svg';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Explore from './pages/Explore';

function App() {
  const navLinks = [
    { name: 'Home', path: '/', element: <Home/> },
    { name: 'Explore', path: '/explore', element: <Explore/> },
  ]

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
