export interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: string; // Keep as string for API consistency, parse to Date in UI if needed
  genre: string;
  director: string;
  imageUrl?: string; // Matching movies.json
  trailerUrl?: string;
  // image?: string; // This was used in MovieListPage, but movies.json has imageUrl. Consolidate to imageUrl.
}

// Add other shared types here if any, for example, for User or Comment
export interface User {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin'; // Example roles
}

export interface Comment {
    id: string;
    userId: string;
    username: string;
    movieId: string;
    text: string;
    createdAt: string; // Keep as string for API consistency
}

export interface PaginatedMoviesResponse {
  movies: Movie[];
  currentPage: number;
  totalPages: number;
  totalMovies: number;
  limit: number;
} 