import React, { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
// import { Link } from 'react-router-dom'; // Link seems unused here, consider removing if not needed later
import './MovieDetailPage.css'; // Import the CSS file

// Align with backend models
interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  genre: string;
  director: string;
  imageUrl?: string;
  trailerUrl?: string;
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
  const [currentCommentPage, setCurrentCommentPage] = useState(1); // State for current comment page
  const commentsPerPage = 5; // Number of comments per page

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
      setCurrentCommentPage(1); // Go to first page of comments to see the new one
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
      const updatedComments = comments.filter(c => c.id !== commentId);
      setComments(updatedComments);
      // Adjust current page if the last item on the page was deleted
      const totalCommentPagesAfterDelete = Math.ceil(updatedComments.length / commentsPerPage);
      if (currentCommentPage > totalCommentPagesAfterDelete && totalCommentPagesAfterDelete > 0) {
        setCurrentCommentPage(totalCommentPagesAfterDelete);
      } else if (totalCommentPagesAfterDelete === 0) {
        setCurrentCommentPage(1); // Reset to 1 if no comments left
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete comment');
    }
  };

  if (loadingMovie) return <p className="loading-message" aria-live="polite">Loading movie details...</p>;
  if (error) return <p className="error-message" role="alert" aria-live="assertive">Error: {error}</p>;
  if (!movie) return <p className="info-message" aria-live="polite">Movie not found.</p>;

  // Function to convert YouTube URL to embeddable URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    let videoId: string | null = null;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        if (urlObj.pathname === '/watch') {
          videoId = urlObj.searchParams.get('v');
        } else if (urlObj.pathname.startsWith('/embed/')) {
          videoId = urlObj.pathname.split('/embed/')[1].split('?')[0];
        }
      } else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.substring(1).split('?')[0];
      }
    } catch (e) {
      console.error('Invalid URL for YouTube video:', e);
      return null;
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null; // Return null if not a valid YouTube URL or ID not found
  };

  const embedUrl = movie.trailerUrl ? getYouTubeEmbedUrl(movie.trailerUrl) : null;

  // Comments Pagination logic
  const indexOfLastComment = currentCommentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);
  const totalCommentPages = Math.ceil(comments.length / commentsPerPage);

  const paginateComments = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalCommentPages) {
      setCurrentCommentPage(pageNumber);
    }
  };

  return (
    <div className="movie-detail-page" role="main">
      {loadingMovie && <p className="loading-message text-center" aria-live="polite">Loading movie details...</p>}
      {error && <p className="error-message text-center" role="alert" aria-live="assertive">Error: {error}</p>}
      {!loadingMovie && !movie && <p className="error-message text-center" aria-live="polite">Movie not found.</p>}

      {movie && (
        <>
          <div className="movie-detail-layout">
            {movie.imageUrl && (
              <div className="movie-detail-image-container">
                <img
                  src={movie.imageUrl}
                  alt={movie.title}
                  className="movie-detail-image"
                />
              </div>
            )}
            <div className="movie-detail-info">
              <h1>{movie.title}</h1>
              <div className="meta-info">
                <p><strong>Director:</strong> {movie.director || 'N/A'}</p>
                <p><strong>Genre:</strong> {movie.genre || 'N/A'}</p>
                <p><strong>Release Date:</strong> {new Date(movie.releaseDate).toLocaleDateString()}</p>
              </div>
              <p className="description">{movie.description}</p>
            </div>
          </div>

          {embedUrl ? (
            <div className="trailer-section">
              <h2>Trailer</h2>
              <div className="trailer-container">
                <iframe 
                  src={embedUrl} 
                  title={`Trailer for ${movie.title}`}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="movie-trailer-iframe"
                ></iframe>
              </div>
            </div>
          ) : movie.trailerUrl && (
            <p className="trailer-info">Could not embed trailer. <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube</a></p>
          )}

          <div className="comments-section" aria-label="Comments section">
            <h3>Comments ({comments.length})</h3>
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <textarea 
                  value={newCommentText} 
                  onChange={(e) => setNewCommentText(e.target.value)} 
                  placeholder="Add your comment..." 
                  rows={4}
                  aria-label="Add your comment"
                  aria-required="true"
                />
                <button type="submit" disabled={!newCommentText.trim()}>Post Comment</button>
                {commentError && <p className="comment-error-message" role="alert" aria-live="assertive">{commentError}</p>}
              </form>
            ) : (
              <p className="login-prompt">Please <a href="/login">login</a> to post comments.</p>
            )}
            {loadingComments ? (
              <p className="loading-message" aria-live="polite">Loading comments...</p>
            ) : (
              <>
                {!loadingComments && comments.length === 0 && (
                  <p>No comments yet. Be the first to comment!</p>
                )}
                
                {!loadingComments && comments.length > 0 && (
                  <ul className="comment-list">
                    {currentComments.map(comment => (
                      <li key={comment.id} className="comment-item">
                        <strong>{comment.username || 'User'}</strong>
                        <p>{comment.text}</p>
                        <p className="comment-date">{new Date(comment.createdAt).toLocaleString()}</p>
                        {(currentUserRole === 'admin' || currentUserId === comment.userId) && (
                           <button onClick={() => handleCommentDelete(comment.id)} className="delete-comment-button">
                             Delete
                           </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Comments Pagination Controls */}
                {comments.length > commentsPerPage && (
                  <div className="pagination-controls comments-pagination">
                    <button 
                      onClick={() => paginateComments(currentCommentPage - 1)} 
                      disabled={currentCommentPage === 1}
                      aria-label="Go to previous page of comments"
                    >
                      Previous
                    </button>
                    <span aria-label={`Comments page ${currentCommentPage} of ${totalCommentPages}`} aria-live="polite">
                      Page {currentCommentPage} of {totalCommentPages}
                    </span>
                    <button 
                      onClick={() => paginateComments(currentCommentPage + 1)} 
                      disabled={currentCommentPage === totalCommentPages}
                      aria-label="Go to next page of comments"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MovieDetailPage; 