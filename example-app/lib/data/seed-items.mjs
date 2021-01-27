import { saveItems } from './save-items';

const MAX_ITEMS = 11;

/**
 * Faux data store of 22 items which can be paginated
 * at 5 items per page from the given startId.
 */
export const seedItems = async (max = MAX_ITEMS) => {
  const items = Array(max + 1).fill().map((_, i) => ({ id: i }));
  await saveItems(items);
  return items;
};
