import * as CircularJSON from 'circular-json';
import { Logging } from '@google-cloud/logging';
import { Data, Finisher, Printer } from '../../domain';
import { PubSubPayload, isPubsub } from '../../infrastructure';
import { COLORS, decode, parse } from '../../util';
import { LoggerOptions } from '../../';
import { Request } from '../../';

export class Logger implements Printer, Finisher {
  private data: Data;
  private gcloudLogging?: Logging;
  private gcloudLog?: any;
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
      
      // Si está habilitado Google Cloud Logging, usar esa librería
      if (this.options.useGCloudLogging && this.gcloudLog) {
        this.logToGCloud(json, isError, statusCode);
      } else {
        // Usar console.log tradicional
        this.logToConsole(json, log, statusCode);
      }
    } catch (error) {
      console.log('Logger error => ', error);
      console.log(this.data);
    }
  }

  private logToGCloud(json: string, isError: boolean, statusCode: number): void {
    try {
      const severity = isError ? 'ERROR' : 'INFO';
      const metadata = {
        severity,
        httpRequest: {
          status: statusCode,
          requestUrl: this.data.INFO.__url,
          requestMethod: this.data.INFO.__method,
        },
        labels: {
          domain: this.options.domain,
          service: this.options.service,
          module: this.options.module || 'default',
        },
      };

      const entry = this.gcloudLog.entry(metadata, JSON.parse(json));
      this.gcloudLog.write(entry);
    } catch (error) {
      console.error('Error writing to Google Cloud Logging:', error);
      // Fallback a console.log si hay error
      this.logToConsole(json, isError ? 'error' : 'log', statusCode);
    }
  }

  private logToConsole(json: string, log: 'log' | 'error', statusCode: number): void {
    if (!this.options.colors) {
      console[log](json);
      return;
    }
    const color =
      statusCode >= 200 && statusCode <= 300 ? COLORS.CYAN : COLORS.RED;
    console[log](color, json);
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
  constructor(req: Request, private options: LoggerOptions) {
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

    // Inicializar Google Cloud Logging si está habilitado
    if (this.options.useGCloudLogging) {
      try {
        this.gcloudLogging = new Logging({
          projectId: this.options.gcloudProjectId,
        });
        this.gcloudLog = this.gcloudLogging.log(
          `${this.options.domain}-${this.options.service}-logs`
        );
      } catch (error) {
        console.warn('Error initializing Google Cloud Logging:', error);
        console.warn('Falling back to console logging');
      }
    }
  }
}
