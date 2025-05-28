import fs from 'fs/promises';
import path from 'path';

const DATA_DIR_PATH = path.resolve(__dirname, '..', '..', 'data');

export async function ensureDataDirectoryExists() {
  try {
    await fs.mkdir(DATA_DIR_PATH, { recursive: true });
  } catch (error) {
    console.error(`Error ensuring data directory exists at ${DATA_DIR_PATH}:`, error);
    throw error;
  }
}

export const MOVIES_FILE_PATH = path.join(DATA_DIR_PATH, 'movies.json');
export const USERS_FILE_PATH = path.join(DATA_DIR_PATH, 'users.json');
export const COMMENTS_FILE_PATH = path.join(DATA_DIR_PATH, 'comments.json');

export async function readDataFromFile<T>(filePath: string): Promise<T[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    if (!fileContent.trim()) {
      return [];
    }
    return JSON.parse(fileContent) as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`File ${filePath} not found. Returning empty array.`);
      await fs.writeFile(filePath, JSON.stringify([], null, 2));
      return [];
    }
    console.error(`Error reading file ${filePath}:`, error);
    throw new Error(`Failed to read data from ${filePath}: ${(error as Error).message}`);
  }
}

export async function saveDataToFile<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw new Error(`Failed to save data to ${filePath}: ${(error as Error).message}`);
  }
}
