import React from 'react';
import WeatherWidget from '../components/WeatherWidget';

const HomePage: React.FC = () => {
  return (
    <div>
      <h1>Welcome to the Film Site!</h1>
      <p>Browse our collection of movies, register, and leave comments.</p>
      
      <hr style={{ margin: '30px 0' }} />
      
      <WeatherWidget />
    </div>
  );
};

export default HomePage; 