import { reject } from 'ramda';
import { loadItems } from './load-items';
import { saveItems } from './save-items';

export const deleteItem = async (idNumOrStr) => {
  const id = parseInt(idNumOrStr, 10);
  const items = await loadItems();
  const updated = reject(((i) => i.id === id), items);
  await saveItems(updated);
  return updated;
};
