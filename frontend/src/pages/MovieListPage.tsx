import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Align with backend/src/models/Movie.ts
interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: string; // Keep as string for simplicity, or parse Date
  genre: string;
  director: string;
}

const MovieListPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/movies'); // Assuming backend runs on port 5000
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMovies(data);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) return <p>Loading movies...</p>;
  if (error) return <p>Error loading movies: {error}</p>;

  return (
    <div>
      <h2>Movies</h2>
      {movies.length === 0 ? (
        <p>No movies available.</p>
      ) : (
        <ul>
          {movies.map(movie => (
            <li key={movie.id}>
              <h3><Link to={`/movie/${movie.id}`}>{movie.title}</Link></h3>
              <p>{movie.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MovieListPage; 