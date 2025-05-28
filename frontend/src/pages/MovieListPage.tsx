import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './MovieListPage.css';
import { Movie, PaginatedMoviesResponse } from '../types';

const MovieListPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [moviesPerPage] = useState<number>(9);

  const fetchMovies = useCallback(async (page: number, limit: number, genre?: string, search?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (genre && genre !== 'All Genres') params.append('genre', genre.toLowerCase());
      if (search) params.append('search', search);

      const response = await axios.get<PaginatedMoviesResponse>(`/api/movies?${params.toString()}`);
      
      setMovies(response.data.movies || []);
      setCurrentPage(response.data.currentPage || 1);
      setTotalPages(response.data.totalPages || 0);

    } catch (err) {
      setError('Failed to fetch movies. Please try again later.');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setMovies, setCurrentPage, setTotalPages]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (genres.length === 0 || (genres.length === 1 && genres[0] === 'All Genres')) {
          const genresResponse = await axios.get<string[]>('/api/movies/genres');
          setGenres(['All Genres', ...genresResponse.data]);
        }
        
        await fetchMovies(currentPage, moviesPerPage, selectedGenre, searchTerm);

      } catch (err) {
        console.error("Failed to load initial data (genres/movies):", err);
        setError('Failed to load necessary page data. Please refresh or try again later.');
        if (genres.length === 0) setGenres(['All Genres']);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, selectedGenre, searchTerm, moviesPerPage, fetchMovies, genres, setGenres]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); 
  };

  const handleGenreChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedGenre(event.target.value);
    setCurrentPage(1); 
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  if (loading && movies.length === 0) {
    return <div className="movie-list-loading" aria-live="polite">Loading movies...</div>;
  }

  if (error && movies.length === 0) {
    return <div className="movie-list-error" role="alert" aria-live="assertive">Error: {error}</div>;
  }

  return (
    <div className="movie-list-page" role="main">
      <h1 className="movie-list-title">Explore Our Movie Collection</h1>
      {error && movies.length > 0 && 
        <div className="movie-list-error subtle-error" role="alert">Notice: {error}</div>
      }
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
          aria-label="Search movies by title"
        />
        <select 
          value={selectedGenre} 
          onChange={handleGenreChange} 
          className="genre-select"
          aria-label="Select movie genre"
          disabled={genres.length <= 1}
        >
          {genres.map(genre => (
            <option key={genre} value={genre}>{genre.charAt(0).toUpperCase() + genre.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading && movies.length > 0 && 
        <p className="movie-list-loading-inline" aria-live="polite">Updating list...</p>
      } 
      
      {movies.length === 0 && !loading && (
        <div className="no-movies-found" aria-live="polite">No movies found matching your criteria.</div>
      )}

      <div className="movie-grid">
        {movies.map(movie => (
          <div key={movie.id} className="movie-card-item">
            <img 
              src={movie.imageUrl || 'https://via.placeholder.com/300x450.png?text=No+Image'} 
              alt={movie.title} 
              className="movie-card-image" 
            />
            <div className="movie-card-content">
              <h3 className="movie-card-title">{movie.title}</h3>
              <Link to={`/movie/${movie.id}`} className="movie-card-link">View Details</Link>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1 || loading}
            aria-label="Go to previous page of movies"
          >
            Previous
          </button>
          <span aria-label={`Page ${currentPage} of ${totalPages}`} aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages || loading}
            aria-label="Go to next page of movies"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MovieListPage;