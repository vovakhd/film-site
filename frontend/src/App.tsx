import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useParams, useNavigate } from 'react-router-dom';
import './App.css';

// Import page components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MovieListPage from './pages/MovieListPage';
import MovieDetailPage from './pages/MovieDetailPage';
import NotFoundPage from './pages/NotFoundPage';

// Import AdminRoute
import AdminRoute from './components/AdminRoute';

// Import Admin Page Components
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMovieList from './pages/admin/AdminMovieList';
import AdminMovieNew from './pages/admin/AdminMovieNew';
import AdminMovieEdit from './pages/admin/AdminMovieEdit';

// Updated Navbar component
const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const decodeTokenForNavbar = (token: string): { role: string } | null => {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;
      const decodedJson = atob(payloadBase64);
      return JSON.parse(decodedJson);
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
      if (token) {
        const decoded = decodeTokenForNavbar(token);
        setUserRole(decoded ? decoded.role : null);
      } else {
        setUserRole(null);
      }
    };
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/login');
    window.dispatchEvent(new Event('authChange'));
  };

  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/movies">Movies</Link></li>
        {isAuthenticated && userRole === 'admin' && (
          <li><Link to="/admin">Admin</Link></li>
        )}
        {isAuthenticated ? (
          <>
            <li><span>Logged In ({userRole})</span></li>
            <li><button onClick={handleLogout}>Logout</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

function App() {
  useEffect(() => {
    const currentHour = new Date().getHours();
    // Night time between 8 PM (20) and 6 AM (6)
    if (currentHour >= 20 || currentHour < 6) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    // Optional: Set an interval to check the time periodically if needed
    // const intervalId = setInterval(() => { ... }, 60000); // Check every minute
    // return () => clearInterval(intervalId);
  }, []);

  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/movies" element={<MovieListPage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="movies" element={<AdminMovieList />} />
            <Route path="movies/new" element={<AdminMovieNew />} />
            <Route path="movies/edit/:movieId" element={<AdminMovieEdit />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
