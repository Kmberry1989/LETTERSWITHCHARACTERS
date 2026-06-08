import { readFileSync } from 'fs';
import path from 'path';

let cachedWordSet: Set<string> | null = null;
let cachedWordList: string[] | null = null;

function loadWordSet() {
  if (cachedWordSet) {
    return cachedWordSet;
  }

  const wordListPath = path.join(process.cwd(), 'src/lib/word-lists/english-words.txt');
  const contents = readFileSync(wordListPath, 'utf8');

  cachedWordSet = new Set(
    contents
      .split(/\r?\n/)
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean)
  );

  return cachedWordSet;
}

export function getPlayableWordList() {
  if (cachedWordList) {
    return cachedWordList;
  }

  cachedWordList = Array.from(loadWordSet());
  return cachedWordList;
}

function isDictionaryHit(word: string) {
  const dictionary = loadWordSet();
  const normalized = word.toLowerCase();

  if (dictionary.has(normalized)) {
    return true;
  }

  const candidates = new Set<string>([
    normalized,
    normalized.replace(/'s$/, ''),
  ]);

  if (normalized.endsWith('ies') && normalized.length > 4) {
    candidates.add(`${normalized.slice(0, -3)}y`);
  }

  if (normalized.endsWith('ves') && normalized.length > 4) {
    candidates.add(`${normalized.slice(0, -3)}f`);
    candidates.add(`${normalized.slice(0, -3)}fe`);
  }

  if (normalized.endsWith('es') && normalized.length > 3) {
    candidates.add(normalized.slice(0, -2));
    candidates.add(normalized.slice(0, -1));
  }

  if (normalized.endsWith('s') && normalized.length > 3) {
    candidates.add(normalized.slice(0, -1));
  }

  if (normalized.endsWith('ied') && normalized.length > 4) {
    candidates.add(`${normalized.slice(0, -3)}y`);
  }

  if (normalized.endsWith('ed') && normalized.length > 3) {
    candidates.add(normalized.slice(0, -2));
    candidates.add(normalized.slice(0, -1));
    candidates.add(`${normalized.slice(0, -2)}e`);
  }

  if (normalized.endsWith('ing') && normalized.length > 4) {
    candidates.add(normalized.slice(0, -3));
    candidates.add(`${normalized.slice(0, -3)}e`);
  }

  if (normalized.endsWith('er') && normalized.length > 3) {
    candidates.add(normalized.slice(0, -2));
  }

  if (normalized.endsWith('est') && normalized.length > 4) {
    candidates.add(normalized.slice(0, -3));
  }

  if (normalized.endsWith('ly') && normalized.length > 3) {
    candidates.add(normalized.slice(0, -2));
  }

  return Array.from(candidates).some((candidate) => dictionary.has(candidate));
}

export function validatePlayableWord(word: string) {
  const normalized = String(word || '').trim().toLowerCase();

  if (normalized.length < 2) {
    return { isValid: false, reason: 'Words must be at least 2 letters long.' };
  }

  if (!/^[a-z]+$/.test(normalized)) {
    return { isValid: false, reason: 'Words can only contain letters.' };
  }

  if (!isDictionaryHit(normalized)) {
    return {
      isValid: false,
      reason: 'That word is not in the playable dictionary.',
    };
  }

  return { isValid: true, reason: 'Word accepted.' };
}
