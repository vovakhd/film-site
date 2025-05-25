import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminPage.css'; // Import the shared admin CSS

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
        const data = await response.json();
        // Check if data is an array directly, or if it's an object with a 'movies' property
        if (Array.isArray(data)) {
          setMovies(data);
        } else if (data && Array.isArray(data.movies)) {
          setMovies(data.movies);
        } else {
          // Handle unexpected data structure
          console.error("Unexpected data structure from /api/movies:", data);
          setMovies([]); // Set to empty array to prevent .map error
          setError("Received unexpected data format from server.");
        }
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
  if (error) return <div className="admin-page-container"><p className="error-message-admin">Error fetching movies: {error}</p></div>;

  return (
    <div className="admin-page-container">
      <h2>Manage Movies</h2>
      <Link to="/admin/movies/new" className="admin-button-link">
        Add New Movie
      </Link>
      
      {/* Display success/error messages from delete operation if any */}
      {error && <p className="error-message-admin">{error}</p>} 
      {/* {successMessage && <p className="success-message-admin">{successMessage}</p>} */}
      {/* Consider adding a successMessage state for delete success indication */} 

      {movies.length === 0 ? (
        <p>No movies found. Add one!</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Director</th>
              <th>Genre</th>
              <th>Release Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id}>  
                <td>
                  {movie.imageUrl && 
                    <img src={movie.imageUrl} alt={movie.title} className="thumbnail" />
                  }
                </td>
                <td>{movie.title}</td>
                <td>{movie.director}</td>
                <td>{movie.genre}</td>
                <td>{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString() : 'N/A'}</td>
                <td className="action-buttons">
                  <Link to={`/admin/movies/edit/${movie.id}`} className="edit-button">
                    Edit
                  </Link>
                  <button type="button" onClick={() => handleDeleteMovie(movie.id)} className="delete-button">
                    Delete
                  </button>
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