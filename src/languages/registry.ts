import { LanguageNotFoundError } from './errors.js';
import { python } from './python.js';
import { typescript } from './typescript.js';
import type { Language, LanguageId } from './types.js';

const languages: Language[] = [typescript, python];

export function listLanguageIds(): LanguageId[] {
  return languages.map((l) => l.id);
}

export function listLanguages(): readonly Language[] {
  return languages;
}

export function getLanguage(id: string): Language {
  const language = languages.find((l) => l.id === id);
  if (!language) {
    throw new LanguageNotFoundError(id, listLanguageIds());
  }
  return language;
}
