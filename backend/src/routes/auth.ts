import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { User } from '../models/User';

const router = express.Router();

const USERS_FILE_PATH = path.resolve(__dirname, '..', '..', 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  process.exit(1);
}

// Helper to ensure data directory and users.json exist
async function ensureUsersFileExists() {
  try {
    await fs.mkdir(path.dirname(USERS_FILE_PATH), { recursive: true });
    // Try to read, if ENOENT, create an empty array file
    try {
      await fs.access(USERS_FILE_PATH);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.writeFile(USERS_FILE_PATH, JSON.stringify([], null, 2));
      }
    }
  } catch (error) {
    console.error('Error ensuring users file infrastructure:', error);
  }
}

// Helper function to read users from the JSON file
async function getUsersFromFile(): Promise<User[]> {
  await ensureUsersFileExists(); 
  try {
    const fileContent = await fs.readFile(USERS_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent) as User[];
  } catch (error) {
    // If file doesn't exist or is empty/corrupt, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.writeFile(USERS_FILE_PATH, JSON.stringify([], null, 2)); // Create if not exists
        return [];
    }
    console.error('Error reading users file:', error);
    return []; 
  }
}

// Helper function to write users to the JSON file
async function saveUsersToFile(usersToSave: User[]): Promise<void> {
  await ensureUsersFileExists();
  try {
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(usersToSave, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const users = await getUsersFromFile();
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const existingUser = users.find(user => user.email === email || user.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: (Date.now() + Math.random()).toString(36), // Robust ID
      username,
      email,
      password: hashedPassword,
      role: 'user' // Set default role to 'user'
    };
    users.push(newUser);
    await saveUsersToFile(users);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const users = await getUsersFromFile();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials (user not found)' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials (password mismatch)' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role /* Add role to token payload */ }, 
      JWT_SECRET, // Використовуємо змінну оточення
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

export default router; 