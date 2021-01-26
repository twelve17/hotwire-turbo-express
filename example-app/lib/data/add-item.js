import { reject } from 'ramda';
import { loadItems } from './load-items';
import { saveItems } from './save-items';

export const addItem = async () => {
  const items = await loadItems();
  const maxId = items.reduce((acc, i) => {
    return (i.id > acc) ? i.id : acc;
  }, 0);
  const newItem = { id: maxId + 1 };
  const updated = items.concat([newItem])
  await saveItems(updated);
  return newItem;
}