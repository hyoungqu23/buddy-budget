const removeDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Strict ASCII: drop non-ASCII letters; fallback handled below
const toAscii = (s: string) =>
  removeDiacritics(s)
    .replace(/[^A-Za-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .trim();

export const slugify = (name: string) => {
  const base = toAscii(name) || "space";
  const rand = nanoid(8).toLowerCase();
  return `${base}-${rand}`;
};
import { nanoid } from "nanoid";
