import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface MovieFormData {
  title: string;
  description: string;
  releaseDate: string; // Будемо відправляти як рядок YYYY-MM-DD
  genre: string;
  director: string;
  imageUrl?: string;
  trailerUrl?: string;
}

const AdminMovieNew: React.FC = () => {
  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    description: '',
    releaseDate: '',
    genre: '',
    director: '',
    imageUrl: '',
    trailerUrl: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in as admin.');
      return;
    }

    // Проста валідація на клієнті (можна розширити)
    if (!formData.title || !formData.description || !formData.releaseDate || !formData.genre || !formData.director) {
      setError('Please fill in all required fields: Title, Description, Release Date, Genre, Director.');
      return;
    }

    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
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

      setSuccessMessage('Movie added successfully!');
      // Очистити форму
      setFormData({
        title: '',
        description: '',
        releaseDate: '',
        genre: '',
        director: '',
        imageUrl: '',
        trailerUrl: '',
      });
      // Через 2 секунди перенаправити на список фільмів
      setTimeout(() => {
        navigate('/admin/movies');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to add movie. Please try again.');
      console.error("Failed to add movie:", err);
    }
  };

  return (
    <div>
      <h2>Add New Movie (Admin)</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '500px', gap: '10px' }}>
        <div>
          <label htmlFor="title">Title: (*)</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%' }} />
        </div>
        <div>
          <label htmlFor="description">Description: (*)</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} required style={{ width: '100%', minHeight: '80px' }} />
        </div>
        <div>
          <label htmlFor="releaseDate">Release Date: (*)</label>
          <input type="date" id="releaseDate" name="releaseDate" value={formData.releaseDate} onChange={handleChange} required style={{ width: '100%' }} />
        </div>
        <div>
          <label htmlFor="genre">Genre: (*)</label>
          <input type="text" id="genre" name="genre" value={formData.genre} onChange={handleChange} required style={{ width: '100%' }} />
        </div>
        <div>
          <label htmlFor="director">Director: (*)</label>
          <input type="text" id="director" name="director" value={formData.director} onChange={handleChange} required style={{ width: '100%' }} />
        </div>
        <div>
          <label htmlFor="imageUrl">Image URL:</label>
          <input type="url" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} style={{ width: '100%' }} />
        </div>
        <div>
          <label htmlFor="trailerUrl">Trailer URL (YouTube embed link preferrably):</label>
          <input type="url" id="trailerUrl" name="trailerUrl" value={formData.trailerUrl} onChange={handleChange} style={{ width: '100%' }} />
        </div>
        <button type="submit" style={{ padding: '10px', marginTop: '10px' }}>Add Movie</button>
      </form>
    </div>
  );
};

export default AdminMovieNew; 