import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface DecodedToken {
  id: string;
  username: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

const decodeToken = (token: string): DecodedToken | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    const decodedJson = atob(payloadBase64);
    return JSON.parse(decodedJson) as DecodedToken;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

const AdminRoute: React.FC = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Якщо токена немає, перенаправляємо на сторінку входу
    return <Navigate to="/login" replace />;
  }

  const decodedUser = decodeToken(token);

  if (decodedUser && decodedUser.role === 'admin') {
    // Якщо користувач адмін, показуємо дочірній компонент маршруту
    return <Outlet />;
  } else {
    // Якщо користувач не адмін (або токен не вдалося розкодувати), 
    // перенаправляємо на головну сторінку (або можна показати сторінку "Доступ заборонено")
    // alert('Access Denied: Admins only.'); // Можна додати повідомлення
    return <Navigate to="/" replace />;
  }
};

export default AdminRoute; 