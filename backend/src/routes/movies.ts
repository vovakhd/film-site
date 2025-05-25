import express, { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import authMiddleware from '../middleware/authMiddleware'; // Corrected: Default import
import adminMiddleware from '../middleware/adminMiddleware'; // Corrected: Assuming this is where isAdmin logic resides
import { Movie } from '../models/Movie'; // Corrected: Using imported Movie type
import { AuthenticatedRequest } from '../middleware/authMiddleware'; // Keep this if AuthenticatedRequest is used, or if authMiddleware/adminMiddleware expect it.

const router: Router = express.Router();

// For simplicity, if movies.json always in backend/data:
// __dirname in this context (ts-node running a .ts file) should be the directory of the current file (backend/src/routes)
const moviesFilePath = path.join(__dirname, '..', '..', 'data', 'movies.json'); 

// Local Movie interface removed, as it's imported from ../models/Movie

// Helper function to read movies
const readMovies = (): Movie[] => {
  const moviesData = fs.readFileSync(moviesFilePath, 'utf-8');
  return JSON.parse(moviesData) as Movie[];
};

// Helper function to write movies
const writeMovies = (movies: Movie[]) => {
  fs.writeFileSync(moviesFilePath, JSON.stringify(movies, null, 2));
};

// GET all unique genres
router.get('/genres', (req: Request, res: Response) => {
  try {
    const movies = readMovies();
    const genres = [...new Set(movies.map(movie => movie.genre.toLowerCase()))].sort();
    res.json(genres);
  } catch (error) {
    console.error("Error fetching genres:", error);
    res.status(500).json({ message: 'Error fetching genres' });
  }
});

// GET all movies with pagination, filtering, and search
router.get('/', (req: Request, res: Response) => {
  try {
    let movies: Movie[] = readMovies(); // Ensure movies is typed with the imported Movie
    
    const genreQuery = req.query.genre ? (req.query.genre as string).toLowerCase() : null;
    const searchQuery = req.query.search ? (req.query.search as string).toLowerCase() : null;

    if (genreQuery && genreQuery !== 'all genres') {
      movies = movies.filter(movie => movie.genre.toLowerCase() === genreQuery);
    }

    if (searchQuery) {
      movies = movies.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery) || 
        (movie.description && movie.description.toLowerCase().includes(searchQuery)) // check if description exists
      );
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedMovies = movies.slice(startIndex, endIndex);
    const totalMovies = movies.length;
    const totalPages = Math.ceil(totalMovies / limit);

    res.json({
      movies: paginatedMovies,
      currentPage: page,
      totalPages: totalPages,
      totalMovies: totalMovies,
      limit: limit
    });
  } catch (error) {
    console.error("Error reading or filtering movies:", error);
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// GET a single movie by ID
router.get('/:id', (req: Request, res: Response) => {
    try {
        const movies = readMovies();
        const movie = movies.find(m => m.id === req.params.id);
        if (movie) {
            res.json(movie);
        } else {
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        console.error(`Error fetching movie ${req.params.id}:`, error); // Corrected template literal
        res.status(500).json({ message: 'Error fetching movie' });
    }
});

// POST a new movie (Admin only)
// Assuming AuthenticatedRequest is used by authMiddleware/adminMiddleware or you intend to use req.user
router.post('/', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
    try {
        const movies = readMovies();
        const newMovieData = req.body;
        
        // Ensure all required fields from Movie interface are present or handled
        const newMovie: Movie = {
            id: Date.now().toString(), 
            title: newMovieData.title,
            description: newMovieData.description,
            releaseDate: new Date(newMovieData.releaseDate), // Store as Date object, or .toISOString() if string needed
            genre: newMovieData.genre,
            director: newMovieData.director,
            imageUrl: newMovieData.imageUrl,
            trailerUrl: newMovieData.trailerUrl,
        };
        movies.push(newMovie);
        writeMovies(movies);
        res.status(201).json(newMovie);
    } catch (error) {
        console.error("Error creating movie:", error);
        res.status(500).json({ message: 'Error creating movie' });
    }
});

// PUT update a movie (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
    try {
        let movies = readMovies();
        const movieIndex = movies.findIndex(m => m.id === req.params.id);
        if (movieIndex !== -1) {
            const existingMovie = movies[movieIndex];
            const updatedMovieData = req.body;

            const updatedMovie: Movie = {
                ...existingMovie,
                ...updatedMovieData,
                releaseDate: updatedMovieData.releaseDate ? new Date(updatedMovieData.releaseDate) : existingMovie.releaseDate, // Store as Date object
            };
            
            movies[movieIndex] = updatedMovie;
            writeMovies(movies);
            res.json(updatedMovie);
        } else {
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        console.error(`Error updating movie ${req.params.id}:`, error); // Corrected template literal
        res.status(500).json({ message: 'Error updating movie' });
    }
});

// DELETE a movie (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
    try {
        let movies = readMovies();
        const initialLength = movies.length;
        movies = movies.filter(m => m.id !== req.params.id);
        if (movies.length < initialLength) {
            writeMovies(movies);
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        console.error(`Error deleting movie ${req.params.id}:`, error); // Corrected template literal
        res.status(500).json({ message: 'Error deleting movie' });
    }
});

export default router;