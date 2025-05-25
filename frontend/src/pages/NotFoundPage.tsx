import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css'; // Import the CSS file

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <h1>404</h1>
        <h2>Oops! Page Not Found</h2>
        <p>Sorry, the page you are looking for could not be found or has been moved.</p>
        <Link to="/" className="home-link">Go to Homepage</Link>
      </div>
    </div>
  );
};

export default NotFoundPage; 