import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface MovieFromServer {
  id: string;
  title: string;
  description: string;
  director: string;
  genre: string;
  releaseDate?: string;
  imageUrl?: string;
  trailerUrl?: string;
}

const AdminMovieList: React.FC = () => {
  const [movies, setMovies] = useState<MovieFromServer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/movies');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data: MovieFromServer[] = await response.json();
        setMovies(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch movies.');
        console.error("Failed to fetch movies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const handleDeleteMovie = async (movieId: string) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) {
      return;
    }
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in.');
      return;
    }

    try {
      const response = await fetch(`/api/movies/${movieId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete movie. Server response not JSON or no details.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId));
      alert('Movie deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while deleting the movie.');
      console.error("Failed to delete movie:", err);
    }
  };

  if (loading) return <p>Loading movies...</p>;
  if (error) return <p style={{ color: 'red' }}>Error fetching movies: {error}</p>;

  return (
    <div>
      <h2>Manage Movies (Admin)</h2>
      <Link to="/admin/movies/new" style={{ marginBottom: '20px', display: 'inline-block' }}>
        <button type="button">Add New Movie</button>
      </Link>
      
      {movies.length === 0 ? (
        <p>No movies found. Add one!</p>
      ) : (
        <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Title</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Director</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Genre</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{movie.title}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{movie.director}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{movie.genre}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                  <Link to={`/admin/movies/edit/${movie.id}`} style={{ marginRight: '10px' }}>
                    <button type="button">Edit</button>
                  </Link>
                  <button type="button" onClick={() => handleDeleteMovie(movie.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminMovieList; 