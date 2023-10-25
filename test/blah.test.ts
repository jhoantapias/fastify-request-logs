import isBase64 from 'is-base64';
import _ from 'lodash';
describe('Lodash tests', () => {
  it('Testing isBuffer', () => {
    const body = {
      message: {
        data: 'ewogICAgImhvbGEiOiAibXVuZG8iCn0=',
        publishTime: new Date().toISOString(),
      },
    };
    const isPubsub =
      _.has(body, 'message.data') &&
      isBase64((_.get(body, 'message.data') as unknown) as string);
    console.log(isPubsub);
    expect(isPubsub).toBe(true);
  });
});
