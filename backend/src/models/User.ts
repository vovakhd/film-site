export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // This will be a hashed password
  role: 'user' | 'admin'; // Add role field
} 