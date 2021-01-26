import { promises as fsPromises } from 'fs';
import { JSON_DATA_FILE } from './constants';

export const loadItems = async () => {
  const contents = await fsPromises.readFile(JSON_DATA_FILE);
  return JSON.parse(contents);
}