export class LanguageNotFoundError extends Error {
  readonly requested: string;
  readonly available: readonly string[];

  constructor(requested: string, available: readonly string[]) {
    super(`Unknown language: '${requested}'. Available: ${available.join(', ')}`);
    this.name = 'LanguageNotFoundError';
    this.requested = requested;
    this.available = available;
  }
}
