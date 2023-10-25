import * as CircularJSON from 'circular-json';
import { Data, Finisher, Printer } from '../../domain';
import {
  FastifyRequestModel,
  PubSubPayload,
  isPubsub,
} from '../../infrastructure';
import { COLORS, decode, parse } from '../../util';
import { LoggerOptions } from 'index';

export class Logger implements Printer, Finisher {
  private data: Data;
  public add(key: string, value: unknown): void {
    if (this.options.only_errors) return;
    try {
      if (this.data.LOGS[key]) {
        let contador = 0;
        do {
          contador++;
        } while (this.data.LOGS[`${key} (${contador})`]);
        key = `${key} (${contador})`;
      }
      if (value instanceof Error) {
      }
      this.data.LOGS[key] = value;
    } catch {
      console.log(key, value);
    }
  }

  public error(key: string, value: unknown, code?: string): void {
    try {
      if (!this.data.ERRORS) this.data.ERRORS = {};
      if (this.data.ERRORS[key]) {
        let contador = 0;
        do {
          contador++;
        } while (this.data.ERRORS[`${key} (${contador})`]);
        key = `${key} (${contador})`;
      }
      this.data.ERRORS[key] = { value, code };
    } catch {
      console.log(key, value, code);
    }
  }

  public finish(
    payload: string | object,
    isError: boolean,
    statusCode: number
  ): void {
    let log: 'log' | 'error' = 'log';
    try {
      if (!isError) {
        this.data.RESPONSE =
          typeof payload === 'string' && payload
            ? JSON.parse(payload)
            : payload;
        if (typeof this.data.RESPONSE === 'object')
          this.data.RESPONSE['statusCode'] = statusCode;
      } else {
        log = 'error';
        this.data.ERROR_RESPONSE =
          typeof payload === 'string' && payload
            ? JSON.parse(payload)
            : payload;
        if (this.data.ERROR_RESPONSE)
          this.data.ERROR_RESPONSE.statusCode = statusCode;
      }
      const json = CircularJSON.stringify(this.data);
      if (!this.options.colors) {
        console[log](json);
        return;
      }
      const color =
        statusCode >= 200 && statusCode <= 300 ? COLORS.CYAN : COLORS.RED;
      console[log](color, json);
    } catch (error) {
      console.log('Logger error => ', error);
      console.log(this.data);
    }
  }
  private getBody(body: unknown): Record<string, unknown> {
    if (isPubsub(body)) {
      const {
        message: { data },
      } = body as PubSubPayload;
      return parse(decode(data)) ?? data;
    }
    return body as Record<string, unknown>;
  }
  constructor(req: FastifyRequestModel, private options: LoggerOptions) {
    const { url, method, body, params } = req;
    this.data = {
      INFO: {
        __url: url,
        __method: method,
        __params: params,
        __body: this.getBody(body),
        domain: this.options.domain,
        service: this.options.service,
        module: this.options.module,
      },
      LOGS: {},
      RESPONSE: {},
    };
  }
}
