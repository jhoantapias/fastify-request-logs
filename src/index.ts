import { Logger } from './domain';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import _ from 'lodash';

export type Req = FastifyRequest & {
  logger: Logger;
};

export interface LoggerOptions {
  only_errors: boolean;
  domain: string;
  service: string;
  module?: string;
  colors: boolean;
}

export const LoggerInstance = Logger;

export const logger = (
  application: FastifyInstance,
  options: LoggerOptions
) => {
  application.addHook('preHandler', (req, _res, done) => {
    Object.defineProperty(req, 'logger', {
      value: new Logger(req, options),
    });
    done();
  });
  application.addHook<Record<string, unknown>>(
    'onSend',
    (req: FastifyRequest, res: FastifyReply, payload, done) => {
      const request = req as Req;
      if ('logger' in req) {
        const logger = request.logger as Logger;
        const isError =
          _.isObjectLike(payload) &&
          _.has(payload, 'isError') &&
          payload?.isError === true;
        logger.finish(payload, isError, res?.statusCode);
      } else {
        console.log('MESSAGE: Logger is not implemented', {
          url: req.url,
          method: req.method,
          statusCode: res.statusCode,
          body: req.body,
          response: payload,
        });
        console.log('ERROR: ', payload);
        res.send(payload);
      }
      done();
    }
  );
};
