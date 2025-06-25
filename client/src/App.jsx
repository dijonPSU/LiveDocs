import { useState, useEffect } from 'react';
import LoginPage from './pages/loginPage';
import CallbackPage from './pages/CallbackPage';
import Homepage from './pages/Homepage';
import DocumentPage from './pages/DocumentPage';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom'


import './App.css';

function App() {
    /*

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);


  const renderPage = () => {
    switch (currentPath) {
      case '/callback':
        return <CallbackPage />;
      case '/Homepage':
          return <Homepage />;
      case '/DocumentPage':
        return <DocumentPage />;
      default:
        return <LoginPage />;
    }
  };
  */

  return (
    <Router>
      <Routes>
        <Route path="/Homepage" element={<Homepage />} />
        <Route path="/DocumentPage" element={<DocumentPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App
