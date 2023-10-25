export interface Printer {
  add(key: string, value: unknown): void;
  error(key: string, value: unknown, code?: string): void;
}
export interface Finisher {
  finish(payload: string | object, isError: boolean, statusCode: number): void;
}

export interface Data {
  LOGS: Record<string, unknown>;
  INFO: Record<string, unknown>;
  RESPONSE: Record<string, unknown>;
  ERROR_RESPONSE?: Record<string, unknown>;
  ERRORS?: Record<string, unknown>;
}
