export type ProfileId = 'library' | 'application' | 'experiment';

export type BuildKind = 'distributable' | 'none';

export type Profile = {
  id: ProfileId;
  displayName: string;
  description: string;
  buildKind: BuildKind;
};
