import { Logger } from './domain';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import _ from 'lodash';

export type Req = FastifyRequest & {
  logger: Logger;
};

export const logger = (application: FastifyInstance) => {
  application.addHook('preHandler', (req, _res, done) => {
    Object.defineProperty(req, 'logger', {
      value: new Logger(req),
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
