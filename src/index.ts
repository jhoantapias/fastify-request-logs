import { Logger } from './domain';
import { hasProperty } from './util';
import { isObjectLike } from './util';
import { RequestContext } from './context/RequestContext';

export interface LoggerOptions {
  only_errors: boolean;
  domain: string;
  service: string;
  module?: string;
  colors: boolean;
  useGCloudLogging?: boolean;
  gcloudProjectId?: string;
}

export const LoggerInstance = Logger;

// Exportar funciones de conveniencia para usar AsyncLocalStorage
export { getRequestLogger, printLog, printError } from './context/RequestContext';

interface Instance {
  addHook(
    name: 'preHandler',
    hook: (request: Request, reply: any, done: (err?: Error) => void) => void
  ): void;

  addHook(
    name: 'onSend',
    hook: (
      request: Request,
      reply: Reply,
      payload: Record<string, unknown>,
      done: (err?: Error, newPayload?: any) => void
    ) => void
  ): void;
}
export interface Request {
  id: string;
  logger: Logger;
  url: string;
  method: string;
  body: unknown;
  params: unknown;
}

interface Reply {
  send(data: Record<string, unknown>): void;
  statusCode: number;
}

export const logger = (application: Instance | any, options: LoggerOptions) => {
  if (!application) throw new Error('Application not found');

  const requestContext = RequestContext.getInstance();

  application.addHook(
    'preHandler',
    (req: Request, _: unknown, done: Function) => {
      const loggerInstance = new Logger(req, options);

      // Asociar el logger al request (compatibilidad hacia atrás)
      Object.defineProperty(req, 'logger', {
        value: loggerInstance,
      });

      // Ejecutar el resto del request dentro del contexto AsyncLocalStorage
      requestContext.runWithLogger(loggerInstance, () => {
        done();
      });
    }
  );

  application.addHook(
    'onSend',
    (
      req: Request,
      res: Reply,
      payload: Record<string, unknown>,
      done: Function
    ) => {
      if ('logger' in req) {
        const logger = req.logger as Logger;
        const isError =
          isObjectLike(payload) &&
          hasProperty(payload as object, 'isError') &&
          (payload as { isError?: boolean })?.isError === true;
        logger.finish(payload, isError, res?.statusCode);
      } else {
        console.error('MESSAGE: Logger is not implemented');
        console.log('ERROR: ', payload);
        res.send(payload);
      }
      done();
    }
  );
};
