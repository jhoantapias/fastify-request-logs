import isBase64 from 'is-base64';

export const isPubsub = (body: unknown) => {
  const hasMessageData = (obj: unknown): boolean =>
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    typeof (obj as { message?: any }).message === 'object' &&
    'data' in (obj as { message: { data?: any } }).message;

  return (
    hasMessageData(body) &&
    isBase64((body as { message: { data: string } }).message.data)
  );
};
