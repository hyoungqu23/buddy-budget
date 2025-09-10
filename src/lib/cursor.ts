export type CreatedAtIdCursor = {
  createdAt: string; // ISO string
  id: string;
};

export const encodeCursor = <T extends object>(c: T) =>
  Buffer.from(JSON.stringify(c)).toString('base64url');

export const decodeCursor = <T extends object>(s: string): T =>
  JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
