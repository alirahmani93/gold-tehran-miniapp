export const nowSec = (): number => Math.floor(Date.now() / 1000);

export const hourBucket = (tsSec: number): number => tsSec - (tsSec % 3600);

export const dayKey = (tsSec: number): string => {
  const d = new Date(tsSec * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

export const dayStartSec = (dayKey: string): number => {
  const [y, m, d] = dayKey.split('-').map(Number);
  return Math.floor(Date.UTC(y!, (m ?? 1) - 1, d ?? 1) / 1000);
};
