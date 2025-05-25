import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './MovieListPage.css';
import { Movie, PaginatedMoviesResponse } from '../types'; // Added PaginatedMoviesResponse

const MovieListPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>(''); // Default to empty, meaning 'All Genres'
  const [genres, setGenres] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [moviesPerPage] = useState<number>(9); // Can be adjusted, should match backend or be configurable

  const fetchMovies = useCallback(async (page: number, limit: number, genre?: string, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (genre && genre !== 'All Genres') params.append('genre', genre.toLowerCase()); // Send lowercase to backend
      if (search) params.append('search', search);

      // Explicitly type the expected response data structure
      const response = await axios.get<PaginatedMoviesResponse>(`/api/movies?${params.toString()}`);
      
      // Now response.data is correctly typed
      setMovies(response.data.movies || []); // Fallback to empty array if movies is undefined/null
      setCurrentPage(response.data.currentPage || 1); // Fallback to 1 if undefined/null
      setTotalPages(response.data.totalPages || 0);   // Fallback to 0 if undefined/null

    } catch (err) {
      setError('Failed to fetch movies. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch genres first
        const genresResponse = await axios.get<string[]>('/api/movies/genres');
        setGenres(['All Genres', ...genresResponse.data]);
        // Then fetch movies for the initial page
        // We pass selectedGenre directly, it will be empty string initially (meaning 'All Genres')
        await fetchMovies(currentPage, moviesPerPage, selectedGenre, searchTerm); 
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        setError('Failed to load initial data. Please try again.');
        setGenres(['All Genres']); // Default to prevent errors
      }
      // setLoading(false); // This setLoading is for the initial data load, fetchMovies has its own
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // Run only once on mount

  // This useEffect will run when currentPage, selectedGenre, or searchTerm changes (AFTER initial load)
  useEffect(() => {
    const isInitialMount = currentPage === 1 && selectedGenre === '' && searchTerm === '' && movies.length === 0;
    if (!isInitialMount && !loading) { // Avoid running on initial mount if fetchInitialData is handling it
        fetchMovies(currentPage, moviesPerPage, selectedGenre, searchTerm);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedGenre, searchTerm]); 

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
  
  // The filtering logic is now mostly handled by the backend.
  // Client-side filtering might still be applied if desired on the current page's data,
  // but primary filtering (search, genre) should be done via API params for server-side pagination.
  // const filteredMovies = movies;

  if (loading && movies.length === 0) {
    return <div className="movie-list-loading" aria-live="polite">Loading movies...</div>;
  }

  if (error) {
    return <div className="movie-list-error" role="alert" aria-live="assertive">Error: {error}</div>;
  }

  return (
    <div className="movie-list-page" role="main">
      <h1 className="movie-list-title">Explore Our Movie Collection</h1>
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
              {/*
              <p className="movie-card-director">Director: {movie.director}</p>
              <p className="movie-card-genre">Genre: {movie.genre}</p>
              <p className="movie-card-release">Released: {new Date(movie.releaseDate).toLocaleDateString()}</p>
              <p className="movie-card-description">
                {movie.description.substring(0, 100)}{movie.description.length > 100 ? '...' : ''}
              </p>
              */}
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