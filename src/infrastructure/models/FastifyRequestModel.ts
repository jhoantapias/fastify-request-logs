export interface FastifyRequestModel {
  id: string;
  url: string;
  method: string;
  body: unknown;
  params: unknown;
}
