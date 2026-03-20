export const UNSUPPORTED_NUMERIC_DATE_TRAITS_MESSAGE =
  'OpenRarity currently does not support collections with numeric or date traits';

export class EmptyCollectionError extends Error {
  constructor() {
    super('Collection must contain at least one token');
    this.name = 'EmptyCollectionError';
  }
}

export class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTokenError';
  }
}
