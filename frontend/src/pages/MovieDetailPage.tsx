import React, { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

// Align with backend models
interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  genre: string;
  director: string;
}

interface Comment {
  id: string;
  userId: string; // Received from backend, useful for client-side checks if needed
  username: string; // Add username here
  text: string;
  createdAt: string; // Or Date
  // username?: string; // Future: Backend could populate this
}

const MovieDetailPage: React.FC = () => {
  const { id: movieId } = useParams<{ id: string }>(); // Use movieId consistently
  const [movie, setMovie] = useState<Movie | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCommentText, setNewCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
        setCurrentUserId(payload.id);
        setCurrentUserRole(payload.role);
      } catch (e) {
        console.error('Error decoding token:', e);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setCurrentUserId(null);
        setCurrentUserRole(null);
      }
    }
  }, []); // Runs once on mount

  useEffect(() => {
    if (!movieId) {
      setLoadingMovie(false);
      setError('No movie ID provided.');
      return;
    }

    const fetchMovieDetail = async () => {
      try {
        setLoadingMovie(true);
        const response = await fetch(`http://localhost:5000/api/movies/${movieId}`);
        if (!response.ok) {
          if (response.status === 404) setError('Movie not found');
          else throw new Error(`HTTP error! status: ${response.status}`);
          setMovie(null);
        } else {
          const data = await response.json();
          setMovie(data);
          setError(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred fetching movie');
        setMovie(null);
      } finally {
        setLoadingMovie(false);
      }
    };

    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        const response = await fetch(`http://localhost:5000/api/comments/movie/${movieId}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const data = await response.json();
        setComments(data.sort((a: Comment, b: Comment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (e) {
        console.error('Error fetching comments:', e);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchMovieDetail();
    fetchComments();
  }, [movieId]);

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    setCommentError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setCommentError('You must be logged in to comment.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ movieId, text: newCommentText }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post comment');
      }

      const newComment = await response.json();
      // Update comments state by adding the new comment to the beginning (or sort again)
      setComments(prevComments => [newComment, ...prevComments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setNewCommentText('');
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Failed to post comment');
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to delete comments.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete comment');
      }
      setComments(prevComments => prevComments.filter(c => c.id !== commentId));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete comment');
    }
  };

  if (loadingMovie) return <p>Loading movie details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!movie) return <p>Movie not found.</p>;

  return (
    <div>
      <h2>{movie.title}</h2>
      <p><strong>Director:</strong> {movie.director || 'N/A'}</p>
      <p><strong>Genre:</strong> {movie.genre || 'N/A'}</p>
      <p><strong>Release Date:</strong> {new Date(movie.releaseDate).toLocaleDateString()}</p>
      <p><strong>Description:</strong> {movie.description}</p>

      <hr />
      <h3>Comments</h3>
      {isAuthenticated && (
        <form onSubmit={handleCommentSubmit}>
          <div>
            <textarea
              rows={3}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a comment..."
              required
            ></textarea>
          </div>
          <button type="submit">Post Comment</button>
          {commentError && <p style={{ color: 'red' }}>{commentError}</p>}
        </form>
      )}
      {!isAuthenticated && <p><Link to="/login">Log in</Link> to post a comment.</p>}

      {loadingComments ? (
        <p>Loading comments...</p>
      ) : comments.length > 0 ? (
        <ul>
          {comments.map(comment => (
            <li key={comment.id}>
              <p><strong>{comment.username || 'User'}:</strong> {comment.text}</p>
              <small> - By {comment.username || 'Anonymous'} on {new Date(comment.createdAt).toLocaleString()}</small>
              {(currentUserId === comment.userId || currentUserRole === 'admin') && (
                <button onClick={() => handleCommentDelete(comment.id)} style={{ marginLeft: '10px' }}>
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
};

export default MovieDetailPage; 