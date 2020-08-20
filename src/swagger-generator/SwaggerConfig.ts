class BaseType  {
  type?: 'integer' | 'array' | 'string' | 'number' | 'object' | 'boolean' | string;
}

export class ObjectType extends BaseType {
  enum?: string[];
  example?: any;
  description?: string;
  format?: 'int32' | 'int64' | 'date-time';
  items?: ObjectType;
  $ref?: string;
}

export class SwaggerConfigModel {
  swagger!: string;
  info: any;
  host!: string;
  basePath!: string;
  tags!: { name: string; description: string }[];
  paths!: { [prop: string]: UrlObject };
  definitions!: { [prop: string]: DefinitionObject };
}

export class DefinitionObject {
  type!: 'object';
  required?: string[];
  properties?: {
    [prop: string]: ObjectType;
  };
  description?: string;
}

export class UrlObject {
  get?: RequestObject;
  post?: RequestObject;
  delete?: RequestObject;
  put?: RequestObject;
}

export class RequestObject {
  tags!: string[];
  summary!: string;
  operationId!: string;
  consumes!: ('application/json' | 'multipart/form-data' | 'text/xml' | 'application/x-www-form-urlencoded')[];
  produces!: ('application/octet-stream' | '*/*')[];
  parameters!: RequestParamObject[];
  responses!: ResponseObject;
}

export class RequestParamObject  extends BaseType {
  name!: string;
  in!: 'path' | 'body' | 'query' | 'formData';
  description!: string;
  required!: boolean;
  format?: string;
  schema!: ObjectType;
}

export class ResponseObject {
  '200': ResponseResultObject;
  '201': ResponseResultObject;
  '401': ResponseResultObject;
  '404': ResponseResultObject;
}

export class ResponseResultObject  extends BaseType {
  description!: string;
  format?: string;
  schema?: ObjectType;
}
