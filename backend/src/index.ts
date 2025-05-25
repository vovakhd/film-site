import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth'; // Import auth routes
import movieRoutes from './routes/movies'; // Assuming movies.js is now in src/routes/
import commentRoutes from './routes/comments'; // Import comment routes

const app = express();
const port = process.env.PORT || 5000;

// Middleware для логування ВСІХ запитів
app.use((req, res, next) => {
  console.log(`>>> [GLOBAL] Request received: ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
  next(); // Передаємо управління наступному middleware
});

app.use(cors());
app.use(express.json());

// Use auth routes
app.use('/api/auth', authRoutes);

// Use movie routes
app.use('/api/movies', movieRoutes);

// Use comment routes
app.use('/api/comments', commentRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 