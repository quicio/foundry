import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getProfile,
  listProfileIds,
  listProfiles,
  ProfileNotFoundError,
} from '../../src/profiles/index.js';

const PROJECT_FIELDS = ['id', 'displayName', 'description', 'buildKind'] as const;

describe('profile registry', () => {
  it('contains exactly library, application, experiment', () => {
    expect(listProfileIds()).toEqual(['library', 'application', 'experiment']);
  });

  it('returns the requested profile for a known id', () => {
    expect(getProfile('library').id).toBe('library');
    expect(getProfile('application').id).toBe('application');
    expect(getProfile('experiment').id).toBe('experiment');
  });

  it('throws ProfileNotFoundError listing the valid ids for an unknown id', () => {
    expect(() => getProfile('unknown')).toThrowError(ProfileNotFoundError);
    expect(() => getProfile('unknown')).toThrowError(/library.*application.*experiment/);
  });

  it('every registered profile exposes displayName, description, and buildKind', () => {
    for (const profile of listProfiles()) {
      expect(profile.displayName).toBeTypeOf('string');
      expect(profile.displayName.length).toBeGreaterThan(0);
      expect(profile.description).toBeTypeOf('string');
      expect(profile.description.length).toBeGreaterThan(0);
      expect(['distributable', 'none']).toContain(profile.buildKind);
    }
  });

  it('library and application declare distributable, experiment declares none', () => {
    expect(getProfile('library').buildKind).toBe('distributable');
    expect(getProfile('application').buildKind).toBe('distributable');
    expect(getProfile('experiment').buildKind).toBe('none');
  });

  it('no registered profile carries a commands field', () => {
    for (const profile of listProfiles()) {
      expect(Object.keys(profile).sort()).toEqual([...PROJECT_FIELDS].sort());
    }
  });
});

describe('profile isolation from language', () => {
  it('the profiles module imports nothing from languages', () => {
    const root = join(process.cwd(), 'src', 'profiles');
    for (const entry of readdirSync(root)) {
      const full = join(root, entry);
      if (!statSync(full).isFile() || !entry.endsWith('.ts')) continue;
      const source = readFileSync(full, 'utf8');
      expect(source).not.toMatch(/from\s+['"][^'"]*languages/);
    }
  });

  it('the profile objects expose exactly id, displayName, description, buildKind', () => {
    for (const profile of listProfiles()) {
      expect(Object.keys(profile).sort()).toEqual([...PROJECT_FIELDS].sort());
    }
  });
});
