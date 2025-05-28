import React from 'react';
import { Link } from 'react-router-dom';
import './AdminPage.css'; // Import the shared admin CSS

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="admin-page-container">
      <h1>Admin Dashboard</h1>
      <p>Welcome to the admin panel. From here you can manage various aspects of the site.</p>
      <nav className="admin-dashboard-nav">
        <ul>
          <li><Link to="/admin/movies" className="admin-button-link">Manage Movies</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default AdminDashboardPage; 