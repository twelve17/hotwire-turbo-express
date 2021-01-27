import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const BASE_DIR = path.join(dirname, '..');
export const TMP_DIR = path.join(BASE_DIR, 'tmp');
