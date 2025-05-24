import express, { Request, Response } from 'express';
import { Movie } from '../models/Movie';
import adminMiddleware from '../middleware/adminMiddleware';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { MOVIES_FILE_PATH, readDataFromFile, saveDataToFile } from '../utils/fileUtils';

const router = express.Router();

// Helper to process movies after reading (e.g., convert date strings to Date objects)
function processRawMovies(rawMovies: any[]): Movie[] {
  return rawMovies.map(movieData => {
    if (!movieData || typeof movieData !== 'object') {
      console.warn('Found invalid entry in movies data, skipping:', movieData);
      return null;
    }

    const processedMovie: Partial<Movie> = { ...movieData }; // Start with a partial type
    processedMovie.id = movieData.id || (Date.now() + Math.random()).toString(36); // Ensure ID

    if (movieData.releaseDate) {
      const parsedDate = new Date(movieData.releaseDate);
      if (!isNaN(parsedDate.getTime())) {
        processedMovie.releaseDate = parsedDate;
      } else {
        console.warn(`Invalid releaseDate format for movie titled "${movieData.title || 'Unknown'}": ${movieData.releaseDate}. Date will be undefined.`);
        // releaseDate remains undefined in processedMovie if invalid
      }
    }
    // Ensure all required fields for Movie are present before casting
    if (!processedMovie.title || !processedMovie.description || !processedMovie.releaseDate || !processedMovie.genre || !processedMovie.director) {
        console.warn('Skipping movie due to missing required fields after processing:', processedMovie);
        return null;
    }

    return processedMovie as Movie;
  }).filter(movie => movie !== null) as Movie[];
}

// Get all movies
router.get('/', async (req: Request, res: Response) => {
  console.log(`>>> [movies.ts] Request received for GET /api/movies at ${new Date().toISOString()}`);
  try {
    const rawMovies = await readDataFromFile<any>(MOVIES_FILE_PATH);
    const movies = processRawMovies(rawMovies);
    res.json(movies);
  } catch (error) {
    console.error('!!! [movies.ts] Error in GET /api/movies:', error);
    res.status(500).json({
        message: 'Internal server error while fetching movies',
        errorDetails: (error instanceof Error) ? error.message : String(error)
    });
  }
});

// Get a specific movie by ID
router.get('/:id', async (req: Request, res: Response) => {
  console.log(`>>> [movies.ts] Request received for GET /api/movies/${req.params.id}`);
  try {
    const rawMovies = await readDataFromFile<any>(MOVIES_FILE_PATH);
    const movies = processRawMovies(rawMovies);
    const movie = movies.find(m => m.id === req.params.id);
    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    console.error(`!!! [movies.ts] Error in GET /api/movies/${req.params.id}:`, error);
    res.status(500).json({
        message: 'Error retrieving movie',
        errorDetails: (error instanceof Error) ? error.message : String(error)
    });
  }
});

// Create a new movie
router.post('/', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  console.log(`>>> [movies.ts] Request received for POST /api/movies`);
  try {
    const { title, description, releaseDate, genre, director, imageUrl, trailerUrl } = req.body;

    if (!title || !description || !releaseDate || !genre || !director) {
        return res.status(400).json({ message: 'Fields title, description, releaseDate, genre, director are required' });
    }

    const parsedDate = new Date(releaseDate);
    if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid releaseDate format. Please use a valid date string (e.g., YYYY-MM-DD).' });
    }

    const newMovie: Movie = {
      id: (Date.now() + Math.random()).toString(36),
      title,
      description,
      releaseDate: parsedDate, // Use the validated and parsed date
      genre,
      director,
      imageUrl: imageUrl || undefined,
      trailerUrl: trailerUrl || undefined,
    };

    const rawMovies = await readDataFromFile<any>(MOVIES_FILE_PATH);
    // We process them to ensure consistency, though for new movie it's less critical here
    let movies = processRawMovies(rawMovies); 
    movies.push(newMovie);
    await saveDataToFile<Movie>(MOVIES_FILE_PATH, movies);
    res.status(201).json(newMovie);
  } catch (error) {
    console.error('!!! [movies.ts] Error in POST /api/movies:', error);
    res.status(500).json({
        message: 'Error creating movie',
        errorDetails: (error instanceof Error) ? error.message : String(error)
    });
  }
});

// Update a movie
router.put('/:id', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  console.log(`>>> [movies.ts] Request received for PUT /api/movies/${req.params.id}`);
  try {
    const rawMovies = await readDataFromFile<any>(MOVIES_FILE_PATH);
    let movies = processRawMovies(rawMovies);
    const movieIndex = movies.findIndex(m => m.id === req.params.id);

    if (movieIndex !== -1) {
      const existingMovie = movies[movieIndex];
      const { title, description, releaseDate, genre, director, imageUrl, trailerUrl } = req.body;
      
      // Create updatedMovie by merging, ensuring Date type for releaseDate
      const updatedMovieData: Partial<Movie> = { ...existingMovie };

      if (title !== undefined) updatedMovieData.title = title;
      if (description !== undefined) updatedMovieData.description = description;
      if (genre !== undefined) updatedMovieData.genre = genre;
      if (director !== undefined) updatedMovieData.director = director;
      if (imageUrl !== undefined) updatedMovieData.imageUrl = imageUrl;
      if (trailerUrl !== undefined) updatedMovieData.trailerUrl = trailerUrl;

      if (releaseDate !== undefined) {
        const parsedDate = new Date(releaseDate);
        if (!isNaN(parsedDate.getTime())) {
            updatedMovieData.releaseDate = parsedDate;
        } else {
            // Option 1: Return error for invalid date
            return res.status(400).json({ message: `Invalid releaseDate format for update: ${releaseDate}` });
            // Option 2: Log warning and keep original date (as done by ...existingMovie)
            // console.warn(`Invalid releaseDate format during update for movie ID ${req.params.id}: ${releaseDate}. Keeping original.`);
        }
      }
      
      movies[movieIndex] = updatedMovieData as Movie; // Cast to Movie after updates
      await saveDataToFile<Movie>(MOVIES_FILE_PATH, movies);
      res.json(movies[movieIndex]);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    console.error(`!!! [movies.ts] Error in PUT /api/movies/${req.params.id}:`, error);
    res.status(500).json({
        message: 'Error updating movie',
        errorDetails: (error instanceof Error) ? error.message : String(error)
    });
  }
});

// Delete a movie
router.delete('/:id', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  console.log(`>>> [movies.ts] Request received for DELETE /api/movies/${req.params.id}`);
  try {
    const rawMovies = await readDataFromFile<any>(MOVIES_FILE_PATH);
    let movies = processRawMovies(rawMovies);
    const movieIndex = movies.findIndex(m => m.id === req.params.id);

    if (movieIndex !== -1) {
      const deletedMovie = movies.splice(movieIndex, 1);
      await saveDataToFile<Movie>(MOVIES_FILE_PATH, movies);
      res.json(deletedMovie[0]);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    console.error(`!!! [movies.ts] Error in DELETE /api/movies/${req.params.id}:`, error);
    res.status(500).json({
        message: 'Error deleting movie',
        errorDetails: (error instanceof Error) ? error.message : String(error)
    });
  }
});

export default router; 