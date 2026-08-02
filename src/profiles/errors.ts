export class ProfileNotFoundError extends Error {
  readonly requested: string;
  readonly available: readonly string[];

  constructor(requested: string, available: readonly string[]) {
    super(`Unknown profile: '${requested}'. Available: ${available.join(', ')}`);
    this.name = 'ProfileNotFoundError';
    this.requested = requested;
    this.available = available;
  }
}
