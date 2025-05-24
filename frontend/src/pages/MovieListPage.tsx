import React, { useEffect, useState, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';

// Align with backend/src/models/Movie.ts
interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: string; // Keep as string for simplicity, or parse Date
  genre: string;
  director: string;
  imageUrl?: string;
  trailerUrl?: string;
}

const MovieListPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1); // State for current page
  const moviesPerPage = 6; // Number of movies per page

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/movies'); // Assuming backend runs on port 5000
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Movie[] = await response.json();
        setMovies(data);

        // Extract unique genres
        const uniqueGenres = Array.from(new Set(data.map(movie => movie.genre).filter(genre => genre)));
        setGenres(uniqueGenres.sort());

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

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on search change
  };

  const handleGenreChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedGenre(event.target.value);
    setCurrentPage(1); // Reset to first page on genre change
  };

  const filteredMovies = movies
    .filter(movie => 
      selectedGenre ? movie.genre === selectedGenre : true
    )
    .filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Pagination logic
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div>
      <h2>Movies</h2>

      {/* Search and Filter Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
        <input 
          type="text" 
          placeholder="Search by title..." 
          value={searchTerm} 
          onChange={handleSearchChange} 
          style={{ padding: '8px', width: '300px' }}
        />
        <select 
          value={selectedGenre} 
          onChange={handleGenreChange} 
          style={{ padding: '8px' }}
        >
          <option value="">All Genres</option>
          {genres.map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      {filteredMovies.length === 0 ? (
        <p>No movies available matching your criteria.</p>
      ) : (
        <ul>
          {currentMovies.map(movie => (
            <li key={movie.id} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee', listStyleType: 'none' }}>
              {movie.imageUrl && (
                <img 
                  src={movie.imageUrl} 
                  alt={movie.title} 
                  style={{ width: '100px', height: 'auto', marginRight: '20px', float: 'left' }} 
                />
              )}
              <h3><Link to={`/movie/${movie.id}`}>{movie.title}</Link></h3>
              <p>{movie.description}</p>
              <div style={{ clear: 'both' }}></div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MovieListPage; 