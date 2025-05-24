import fs from 'fs/promises';
import path from 'path';

// Визначаємо шлях до директорії data відносно поточної директорії utils
// Припускаємо, що utils знаходиться в backend/src/utils, тоді data - це ../../data
const DATA_DIR_PATH = path.resolve(__dirname, '..', '..', 'data');

export async function ensureDataDirectoryExists() {
  try {
    await fs.mkdir(DATA_DIR_PATH, { recursive: true });
    // console.log(`Data directory ensured at: ${DATA_DIR_PATH}`);
  } catch (error) {
    console.error(`Error ensuring data directory exists at ${DATA_DIR_PATH}:`, error);
    throw error; // Кидаємо помилку, щоб її можна було обробити вище
  }
}

// Можна також сюди перенести MOVIES_FILE_PATH, USERS_FILE_PATH і т.д.
export const MOVIES_FILE_PATH = path.join(DATA_DIR_PATH, 'movies.json');
export const USERS_FILE_PATH = path.join(DATA_DIR_PATH, 'users.json');
export const COMMENTS_FILE_PATH = path.join(DATA_DIR_PATH, 'comments.json');

// І функції для читання/запису, якщо вони універсальні
// Наприклад:
export async function readDataFromFile<T>(filePath: string): Promise<T[]> {
  await ensureDataDirectoryExists(); // Переконуємося, що директорія існує
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    if (!fileContent.trim()) {
      return [];
    }
    return JSON.parse(fileContent) as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`File ${filePath} not found. Returning empty array.`);
      // Створюємо порожній файл, якщо його немає
      await fs.writeFile(filePath, JSON.stringify([], null, 2));
      return [];
    }
    console.error(`Error reading file ${filePath}:`, error);
    throw new Error(`Failed to read data from ${filePath}: ${(error as Error).message}`);
  }
}

export async function saveDataToFile<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataDirectoryExists(); // Переконуємося, що директорія існує
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw new Error(`Failed to save data to ${filePath}: ${(error as Error).message}`);
  }
}