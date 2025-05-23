import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // To redirect after login

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Check if user is already logged in (e.g., by checking for a token)
  // This is a simple check, could be moved to a global auth context later
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
        // TODO: Update auth state in app (e.g., using Context API or Redux)
        // For now, just navigate to home and force a re-render of Navbar if needed
        navigate('/'); 
        // A more robust way to update Navbar would be through shared state
        window.dispatchEvent(new Event('authChange')); // Simple event to notify navbar
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
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default LoginPage; 