import type { FurnitureItem } from './types';

export function parseFurnitureList(value: string): FurnitureItem[] {
  return value
    .split(/\s*[\/,]\s*/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^(\d+)\s*(?:x\s*)?(.+)$/i);
      if (!match) return { quantity: 1, type: entry };
      return {
        quantity: Math.max(1, Number.parseInt(match[1], 10)),
        type: match[2].trim(),
      };
    })
    .filter((item) => item.type.length > 0);
}

export function formatFurnitureList(items: FurnitureItem[]) {
  return items.map((item) => `${item.quantity} ${item.type}`).join(' / ');
}
