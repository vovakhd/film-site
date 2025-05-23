import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { Comment } from '../models/Comment';
import authMiddleware, { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

const COMMENTS_FILE_PATH = path.resolve(__dirname, '..', '..', 'data', 'comments.json');

// Helper function to ensure the data directory exists (can be refactored to a shared utility if used elsewhere)
async function ensureDataDirectoryExists() {
  try {
    await fs.mkdir(path.dirname(COMMENTS_FILE_PATH), { recursive: true });
  } catch (error) {
    console.error('Error ensuring data directory exists for comments:', error);
  }
}

// Helper function to read comments from the JSON file
async function getCommentsFromFile(): Promise<Comment[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(COMMENTS_FILE_PATH, 'utf-8');
    const commentsFromFile = JSON.parse(fileContent) as any[];
    // Convert createdAt strings back to Date objects
    return commentsFromFile.map(comment => ({
      ...comment,
      createdAt: new Date(comment.createdAt),
    }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // File not found
    }
    console.error('Error reading comments file:', error);
    return [];
  }
}

// Helper function to write comments to the JSON file
async function saveCommentsToFile(commentsToSave: Comment[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(COMMENTS_FILE_PATH, JSON.stringify(commentsToSave, null, 2));
  } catch (error) {
    console.error('Error writing comments file:', error);
  }
}

// Get all comments for a specific movie (public)
router.get('/movie/:movieId', async (req: Request, res: Response) => {
  try {
    const comments = await getCommentsFromFile();
    const movieId = req.params.movieId;
    const movieComments = comments.filter(comment => comment.movieId === movieId);
    res.json(movieComments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving comments' });
  }
});

// Create a new comment for a movie (protected)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const comments = await getCommentsFromFile();
    const { movieId, text } = req.body;
    
    if (typeof req.user !== 'object' || req.user === null || !('id' in req.user) || !('username' in req.user)) {
      return res.status(401).json({ message: 'User ID or Username not found in token or token invalid' });
    }
    const userId = req.user.id as string;
    const username = req.user.username as string; // Get username from token

    if (!movieId || !text) {
      return res.status(400).json({ message: 'Movie ID and text are required' });
    }

    const newComment: Comment = {
      id: (Date.now() + Math.random()).toString(36), // Robust ID
      userId: userId,
      username: username, // Save username
      movieId,
      text,
      createdAt: new Date(),
    };
    comments.push(newComment);
    await saveCommentsToFile(comments);
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment' });
  }
});

// Delete a comment (protected, only by author for now)
router.delete('/:commentId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let comments = await getCommentsFromFile();
    const commentId = req.params.commentId;
    
    // Type guard for req.user
    if (typeof req.user !== 'object' || req.user === null || !('id' in req.user)) {
      return res.status(401).json({ message: 'User ID not found in token or token invalid' });
    }
    const userId = req.user.id as string; // Now safe to access id

    const commentIndex = comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the logged-in user is the author of the comment
    if (comments[commentIndex].userId !== userId) {
      // Later, add: && !req.user.isAdmin (once isAdmin role is implemented)
      return res.status(403).json({ message: 'User not authorized to delete this comment' });
    }

    const deletedComment = comments.splice(commentIndex, 1);
    await saveCommentsToFile(comments);
    res.json(deletedComment[0]);
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

export default router; 