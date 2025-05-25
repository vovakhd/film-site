import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './RegisterPage.css'; // Import the CSS file

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // For success or error messages

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register');
      }

      setMessage(data.message || 'Registration successful!');
      // Optionally, redirect to login or clear form
      setUsername('');
      setEmail('');
      setPassword('');

    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('An unknown error occurred during registration.');
      }
    }
  };

  return (
    <div className="register-page" role="main">
      <div className="register-container">
        <h1>Create Your Account</h1>
        {message && 
          <p 
            className={`message ${message.includes('successful') ? 'success-message' : 'error-message-register'}`}
            role="alert"
            aria-live="assertive"
          >
            {message}
          </p>
        }
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              aria-required="true"
            />
          </div>
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
              placeholder="Create a strong password"
              required
              aria-required="true"
            />
          </div>
          <button type="submit">Register</button>
        </form>
        <p className="switch-form-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage; 