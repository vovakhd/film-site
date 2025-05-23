export interface Comment {
  id: string;
  userId: string; // Foreign key to User
  username: string; // Username of the commenter
  movieId: string; // Foreign key to Movie
  text: string;
  createdAt: Date;
} 