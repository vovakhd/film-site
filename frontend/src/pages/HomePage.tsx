import React from 'react';
import './HomePage.css'; // Import the CSS file
import WeatherWidget from '../components/WeatherWidget'; // Import WeatherWidget
import { Link } from 'react-router-dom'; // Import Link for the button

const HomePage = () => {
  return (
    <main className="home-page-container" role="main">
      <section className="hero-section">
        {/* <div className="hero-overlay"> */}
          <div className="hero-content">
            <h1 className="hero-title">Discover Your Next Favorite Movie</h1>
            <p className="hero-subtitle">Explore thousands of titles, read reviews, and join our community of film lovers.</p>
            <Link to="/movies" className="hero-button">Browse Movies</Link>
          </div>
        {/* </div> */}
      </section>

      <div className="home-page-content"> {/* Wrapper for content below hero */}
        <div className="features-section">
          <h2>Why Choose FilmSite?</h2> {/* Updated title */}
          <div className="features-grid">
            <div className="feature-item">
              <i className="feature-icon">🎬</i> {/* Example icon, replace with actual icons later */}
              <h3>Extensive Collection</h3>
              <p>From blockbusters to timeless classics, find it all here.</p>
            </div>
            <div className="feature-item">
              <i className="feature-icon">💬</i> {/* Example icon */}
              <h3>Community Driven</h3>
              <p>Engage in discussions, read and write reviews.</p>
            </div>
            <div className="feature-item">
              <i className="feature-icon">✨</i> {/* Example icon */}
              <h3>Personalized for You</h3>
              <p>Create watchlists and get recommendations.</p>
            </div>
          </div>
        </div>

        <WeatherWidget />
      </div>
    </main>
  );
};

export default HomePage; 