export const isObjectLike = (value: unknown): boolean =>
  value !== null && typeof value === 'object';
export const hasProperty = (obj: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);
