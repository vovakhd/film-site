import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // To redirect after login, Link for navigation
import './LoginPage.css'; // Import the CSS file

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Optionally verify token with backend here before navigating
      // For now, just navigate if token exists
      // navigate('/'); // Or to a dashboard page
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        setMessage('Login successful!');
        navigate('/'); 
        window.dispatchEvent(new Event('authChange'));
      } else {
        throw new Error('Login successful, but no token received.');
      }

    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('An unknown error occurred during login.');
      }
    }
  };

  return (
    <div className="login-page" role="main">
      <div className="login-container">
        <h1>Login to Your Account</h1>
        {message && 
          <p 
            className={`message ${message.includes('successful') ? 'success-message' : 'error-message-login'}`}
            role="alert"
            aria-live="assertive"
          >
            {message}
          </p>
        }
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              aria-required="true"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              aria-required="true"
            />
          </div>
          <button type="submit">Login</button>
        </form>
        <p className="switch-form-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 