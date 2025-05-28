export interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  genre: string;
  director: string;
  imageUrl?: string;
  trailerUrl?: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
}

export interface Comment {
    id: string;
    userId: string;
    username: string;
    movieId: string;
    text: string;
    createdAt: string;
}

export interface PaginatedMoviesResponse {
  movies: Movie[];
  currentPage: number;
  totalPages: number;
  totalMovies: number;
  limit: number;
} 