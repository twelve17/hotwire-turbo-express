import path from 'path';
import { BASE_DIR } from '../constants';

// A items.json file generated into this tmp dir,
// serving as a mutable storage for examples.
export const JSON_DATA_FILE = path.join(BASE_DIR, 'tmp', 'items.json');
