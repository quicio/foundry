import { ProfileNotFoundError } from './errors.js';
import type { Profile, ProfileId } from './types.js';

const profiles: Profile[] = [
  {
    id: 'library',
    displayName: 'Library',
    description: 'A reusable, distributable package with tests and a build artifact.',
    buildKind: 'distributable',
  },
  {
    id: 'application',
    displayName: 'Application',
    description: 'A runnable service or program with an entrypoint.',
    buildKind: 'distributable',
  },
  {
    id: 'experiment',
    displayName: 'Experiment',
    description: 'A scratch project for trying ideas; build is a no-op.',
    buildKind: 'none',
  },
];

export function listProfileIds(): ProfileId[] {
  return profiles.map((p) => p.id);
}

export function listProfiles(): readonly Profile[] {
  return profiles;
}

export function getProfile(id: string): Profile {
  const profile = profiles.find((p) => p.id === id);
  if (!profile) {
    throw new ProfileNotFoundError(id, listProfileIds());
  }
  return profile;
}
