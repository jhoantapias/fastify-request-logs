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
      if (this.options.useGCloudLogging) {
        if (this.gcloudLog) {
          this.logToGCloud(json, isError, statusCode);
        } else {
          console.warn('⚠️  Google Cloud Logging is enabled but not properly initialized');
          console.warn('📝 Using console logging as fallback');
          this.logToConsole(json, log, statusCode);
        }
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

      // Escribir a Google Cloud Logging de forma asíncrona
      this.gcloudLog.write(entry).then(() => {
        // Éxito silencioso - no spamear la consola
      }).catch((error: any) => {
        console.error('❌ Failed to write to Google Cloud Logging:', error);
        console.error('🔍 Check your credentials and permissions');
        // Fallback a console.log
        this.logToConsole(json, isError ? 'error' : 'log', statusCode);
      });

    } catch (error) {
      console.error('❌ Error preparing Google Cloud Logging entry:', error);
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
        // Validar que se proporcione el project ID
        if (!this.options.gcloudProjectId) {
          console.error('❌ Google Cloud Logging Error: gcloudProjectId is required when useGCloudLogging is true');
          console.error('💡 Solution: Set gcloudProjectId in logger options');
          console.warn('📝 Falling back to console logging');
          return;
        }

        console.log(`🔧 Initializing Google Cloud Logging for project: ${this.options.gcloudProjectId}`);

        this.gcloudLogging = new Logging({
          projectId: this.options.gcloudProjectId,
        });

        const logName = `${this.options.domain}-${this.options.service}-logs`;
        this.gcloudLog = this.gcloudLogging.log(logName);

        console.log(`✅ Google Cloud Logging initialized successfully`);
        console.log(`📄 Log name: ${logName}`);

      } catch (error) {
        console.error('❌ Error initializing Google Cloud Logging:', error);
        console.error('🔍 Common issues:');
        console.error('  1. GOOGLE_APPLICATION_CREDENTIALS not set');
        console.error('  2. Invalid project ID');
        console.error('  3. Missing @google-cloud/logging dependency');
        console.error('  4. Insufficient permissions');
        console.error('💡 Run: gcloud auth application-default login');
        console.warn('📝 Falling back to console logging');
      }
    }
  }
}
