import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboardPage: React.FC = () => {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Welcome, Admin!</p>
      <ul>
        <li><Link to="/admin/movies">Manage Movies</Link></li>
        {/* Add more admin links here as needed */}
      </ul>
    </div>
  );
};

export default AdminDashboardPage; 