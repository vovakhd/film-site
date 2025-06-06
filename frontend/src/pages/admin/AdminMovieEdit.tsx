import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './AdminPage.css'; // Import the shared admin CSS

interface MovieFormData {
  title: string;
  description: string;
  releaseDate: string; // YYYY-MM-DD
  genre: string;
  director: string;
  imageUrl?: string;
  trailerUrl?: string;
}

// Це дані, які ми очікуємо з GET /api/movies/:id
interface MovieDataFromServer extends MovieFormData {
  id: string;
  // releaseDate тут також може бути рядком ISO 8601, який треба конвертувати в YYYY-MM-DD для інпута
}

const AdminMovieEdit: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    description: '',
    releaseDate: '', 
    genre: '',
    director: '',
    imageUrl: '',
    trailerUrl: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovieData = async () => {
      if (!movieId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/movies/${movieId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
          throw new Error(errorData.message || `Movie not found or error fetching data.`);
        }
        const data: MovieDataFromServer = await response.json();
        
        let releaseDateForInput = '';
        if (data.releaseDate) {
            const dateObj = new Date(data.releaseDate);
            if (!isNaN(dateObj.getTime())) {
                releaseDateForInput = dateObj.toISOString().split('T')[0];
            }
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          releaseDate: releaseDateForInput,
          genre: data.genre || '',
          director: data.director || '',
          imageUrl: data.imageUrl || '',
          trailerUrl: data.trailerUrl || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch movie data.');
        console.error("Failed to fetch movie data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovieData();
  }, [movieId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!movieId) {
        setError('Movie ID is missing.');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in as admin.');
      return;
    }
    
    if (!formData.title || !formData.description || !formData.releaseDate || !formData.genre || !formData.director) {
      setError('Please fill in all required fields: Title, Description, Release Date, Genre, Director.');
      return;
    }

    try {
      const response = await fetch(`/api/movies/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      setSuccessMessage('Movie updated successfully!');
      setTimeout(() => {
        navigate('/admin/movies');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to update movie. Please try again.');
      console.error("Failed to update movie:", err);
    }
  };

  if (loading) return <p>Loading movie data...</p>;
  if (error && !loading && !formData.title) {
    return (
      <div className="admin-page-container">
        <h2>Edit Movie</h2>
        <p className="error-message-admin">Error: {error}</p>
        <Link to="/admin/movies" className="admin-button-link">Back to Movie List</Link>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <h2>Edit Movie (ID: {movieId})</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        {error && <p className="error-message-admin">{error}</p>}
        {successMessage && <p className="success-message-admin">{successMessage}</p>}

        <div className="form-group">
          <label htmlFor="title">Title: (*)</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description: (*)</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="releaseDate">Release Date: (*)</label>
          <input type="date" id="releaseDate" name="releaseDate" value={formData.releaseDate} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="genre">Genre: (*)</label>
          <input type="text" id="genre" name="genre" value={formData.genre} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="director">Director: (*)</label>
          <input type="text" id="director" name="director" value={formData.director} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="imageUrl">Image URL:</label>
          <input type="url" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/image.jpg" />
        </div>
        <div className="form-group">
          <label htmlFor="trailerUrl">Trailer URL (YouTube embed link):</label>
          <input type="url" id="trailerUrl" name="trailerUrl" value={formData.trailerUrl} onChange={handleChange} placeholder="https://www.youtube.com/embed/VIDEO_ID" />
        </div>
        <div className="admin-form-actions">
          <Link to="/admin/movies" className="cancel-button">Cancel</Link>
          <button type="submit" className="submit-button">Update Movie</button>
        </div>
      </form>
    </div>
  );
};

export default AdminMovieEdit; 