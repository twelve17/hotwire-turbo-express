import { loadItems } from './load-items';

const LIMIT = 5;

export const listItems = async (startId = 0, limit = LIMIT) => {
  const items = await loadItems();
  const startIndex = items.findIndex(i => i.id == startId);
  const endIndex = startIndex + limit;
  const itemSlice = items.slice(startIndex, endIndex);
  const lastCursor = itemSlice.slice(-1)?.[0]?.id;
  const nextCursor = lastCursor || lastCursor == 0 ? lastCursor + 1 : null;
  const hasMore = nextCursor ? !!items.find(i => i.id == nextCursor) : false;
  return { hasMore, items: itemSlice, nextCursor };
}
