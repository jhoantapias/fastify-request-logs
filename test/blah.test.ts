import isBase64 from 'is-base64';
import { isPubsub } from '../src/infrastructure';
describe('X tests', () => {
  it('Testing isBuffer', () => {
    const body = {
      message: {
        data: 'ewogICAgImhvbGEiOiAibXVuZG8iCn0=',
        publishTime: new Date().toISOString(),
      },
    };

    const isPubsub2 = isPubsub(body);
    console.log(isPubsub);
    expect(isPubsub).toBe(true);
  });
});
