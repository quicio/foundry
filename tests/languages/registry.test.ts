import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getLanguage,
  listLanguageIds,
  listLanguages,
  LanguageNotFoundError,
} from '../../src/languages/index.js';

const LANGUAGE_FIELDS = [
  'id',
  'displayName',
  'packageManager',
  'engines',
  'wiring',
  'resolveBuild',
  'derivePackageName',
] as const;

describe('language registry', () => {
  it('contains exactly typescript, python in insertion order', () => {
    expect(listLanguageIds()).toEqual(['typescript', 'python']);
  });

  it('returns the requested language for a known id', () => {
    expect(getLanguage('typescript').id).toBe('typescript');
    expect(getLanguage('python').id).toBe('python');
  });

  it('throws LanguageNotFoundError listing the valid ids for an unknown id', () => {
    expect(() => getLanguage('klingon')).toThrowError(LanguageNotFoundError);
    expect(() => getLanguage('klingon')).toThrowError(/typescript.*python/);
  });

  it('every registered language exposes the documented contract', () => {
    for (const language of listLanguages()) {
      expect(Object.keys(language).sort()).toEqual([...LANGUAGE_FIELDS].sort());
      expect(language.packageManager).toBeTypeOf('string');
      expect(typeof language.engines).toBe('object');
      expect(typeof language.wiring.check).toBe('string');
      expect(typeof language.wiring.test).toBe('string');
      expect(typeof language.wiring.build).toBe('function');
      expect(typeof language.wiring.format.write).toBe('string');
      expect(typeof language.wiring.format.check).toBe('string');
      expect(typeof language.resolveBuild).toBe('function');
      expect(typeof language.derivePackageName).toBe('function');
    }
  });

  it('wiring.format.write and wiring.format.check are concrete script names, not format:check or format-check', () => {
    for (const language of listLanguages()) {
      expect(language.wiring.format.write).not.toBe('format:check');
      expect(language.wiring.format.write).not.toBe('format-check');
      expect(language.wiring.format.check).not.toBe('format:check');
      expect(language.wiring.format.check).not.toBe('format-check');
    }
  });

  it('resolveBuild(distributable) and resolveBuild(none) differ', () => {
    for (const language of listLanguages()) {
      expect(language.resolveBuild('distributable')).not.toBe(language.resolveBuild('none'));
    }
  });

  it('typescript engines declares node>=22; python engines declares python>=3.12', () => {
    expect(getLanguage('typescript').engines.node).toBe('>=22');
    expect(getLanguage('python').engines.python).toBe('>=3.12');
  });
});

describe('language isolation from profile', () => {
  it('the languages module imports nothing from profiles', () => {
    const root = join(process.cwd(), 'src', 'languages');
    for (const entry of readdirSync(root)) {
      const full = join(root, entry);
      if (!statSync(full).isFile() || !entry.endsWith('.ts')) continue;
      const source = readFileSync(full, 'utf8');
      expect(source).not.toMatch(/from\s+['"][^'"]*profiles/);
    }
  });

  it('no language module source contains the strings library, application, or experiment', () => {
    const root = join(process.cwd(), 'src', 'languages');
    for (const entry of readdirSync(root)) {
      const full = join(root, entry);
      if (!statSync(full).isFile() || !entry.endsWith('.ts')) continue;
      const source = readFileSync(full, 'utf8');
      expect(source).not.toMatch(/['"]library['"]/);
      expect(source).not.toMatch(/['"]application['"]/);
      expect(source).not.toMatch(/['"]experiment['"]/);
    }
  });
});
