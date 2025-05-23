import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { Movie } from '../models/Movie';
import authMiddleware, { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

const MOVIES_FILE_PATH = path.resolve(__dirname, '..', '..', 'data', 'movies.json');
// __dirname should be backend/src/routes, so ../../data/movies.json maps to backend/data/movies.json

// Helper function to ensure the data directory exists
async function ensureDataDirectoryExists() {
  try {
    await fs.mkdir(path.dirname(MOVIES_FILE_PATH), { recursive: true });
  } catch (error) {
    console.error('Error ensuring data directory exists:', error);
    // Depending on the error, you might want to throw it or handle it differently
  }
}

// Helper function to read movies from the JSON file
async function getMoviesFromFile(): Promise<Movie[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(MOVIES_FILE_PATH, 'utf-8');
    const moviesFromFile = JSON.parse(fileContent) as any[]; // Parse as any[] first
    // Convert releaseDate strings back to Date objects
    return moviesFromFile.map(movie => ({
      ...movie,
      releaseDate: new Date(movie.releaseDate),
    }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // File not found, return empty array
    }
    console.error('Error reading movies file:', error);
    return []; // Return empty array on other errors as well for now
  }
}

// Helper function to write movies to the JSON file
async function saveMoviesToFile(moviesToSave: Movie[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    // Dates will be stringified to ISO format by default
    await fs.writeFile(MOVIES_FILE_PATH, JSON.stringify(moviesToSave, null, 2));
  } catch (error) {
    console.error('Error writing movies file:', error);
    // Consider how to handle write errors, maybe re-throw or return a status
  }
}

// Get all movies
router.get('/', async (req: Request, res: Response) => {
  try {
    const movies = await getMoviesFromFile();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving movies' });
  }
});

// Get a specific movie by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const movies = await getMoviesFromFile();
    const movie = movies.find(m => m.id === req.params.id);
    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving movie' });
  }
});

// Create a new movie
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const movies = await getMoviesFromFile();
    const { title, description, releaseDate, genre, director } = req.body;

    if (!title || !description || !releaseDate || !genre || !director) {
        return res.status(400).json({ message: 'All fields (title, description, releaseDate, genre, director) are required' });
    }

    const newMovie: Movie = {
      id: (Date.now() + Math.random()).toString(36), // More robust ID generation
      title,
      description,
      releaseDate: new Date(releaseDate), // Ensure it's a Date object
      genre,
      director,
    };
    movies.push(newMovie);
    await saveMoviesToFile(movies);
    res.status(201).json(newMovie);
  } catch (error) {
    console.error('Error creating movie:', error); // Log the actual error
    res.status(500).json({ message: 'Error creating movie' });
  }
});

// Update a movie
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const movies = await getMoviesFromFile();
    const movieIndex = movies.findIndex(m => m.id === req.params.id);
    if (movieIndex !== -1) {
      const { title, description, releaseDate, genre, director } = req.body;
      const updatedMovie = { ...movies[movieIndex] };

      if (title) updatedMovie.title = title;
      if (description) updatedMovie.description = description;
      if (releaseDate) updatedMovie.releaseDate = new Date(releaseDate);
      if (genre) updatedMovie.genre = genre;
      if (director) updatedMovie.director = director;
      
      movies[movieIndex] = updatedMovie;
      await saveMoviesToFile(movies);
      res.json(movies[movieIndex]);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating movie' });
  }
});

// Delete a movie
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let movies = await getMoviesFromFile();
    const movieIndex = movies.findIndex(m => m.id === req.params.id);
    if (movieIndex !== -1) {
      const deletedMovie = movies.splice(movieIndex, 1);
      await saveMoviesToFile(movies);
      res.json(deletedMovie[0]);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting movie' });
  }
});

export default router; 