import isBase64 from 'is-base64';
import _ from 'lodash';

export const isPubsub = (body: unknown) =>
  _.has(body, 'message.data') &&
  isBase64((_.get(body, 'message.data') as unknown) as string);
