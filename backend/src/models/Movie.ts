export interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: Date;
  genre: string;
  director: string;
  imageUrl?: string;
  trailerUrl?: string;
} 