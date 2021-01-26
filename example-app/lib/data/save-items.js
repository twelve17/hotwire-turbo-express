import { promises as fsPromises } from 'fs';
import { JSON_DATA_FILE } from './constants';

export const saveItems = async (items) => {
  await fsPromises.writeFile(JSON_DATA_FILE, JSON.stringify(items));
}