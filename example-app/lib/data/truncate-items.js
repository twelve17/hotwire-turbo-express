import { saveItems } from './save-items';

export const truncateItems = async () => {
  const emptyItems = [];
  await saveItems(emptyItems);
  return emptyItems;
}