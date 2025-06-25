import { useState, useEffect } from 'react';
import LoginPage from './pages/loginPage';
import CallbackPage from './pages/CallbackPage';
import Homepage from './pages/Homepage';
import './App.css';

function App() {
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
      case '/':
      default:
        return <LoginPage />;
    }
  };

  return (
    // {renderPage()}    <Homepage />
    <>
      {renderPage()}
    </>
  );
}

export default App
