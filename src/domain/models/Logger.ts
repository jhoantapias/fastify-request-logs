export interface Printer {
  add(key: string, value: unknown): void;
}
export interface Finisher {
  finish(payload: string | object, isError: boolean, statusCode: number): void;
}

export interface Data {
  LOGS: Record<string, unknown>;
  REQUEST: Record<string, unknown>;
  RESPONSE: Record<string, unknown>;
  ERROR_RESPONSE?: Record<string, unknown>;
}
