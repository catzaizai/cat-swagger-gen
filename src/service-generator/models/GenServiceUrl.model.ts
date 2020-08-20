import GenServiceParamModel from "./GenServiceParam.model";

class GenServiceUrlModel {
  methodName!: string;
  method!: string;
  summary?: string;
  parameters!: GenServiceParamModel[];
  result!: string;
  path!: string;
  params?: string;
  annotation?:string;
  query?: string;
  body?: string;
  extendConfig?: string;
  config?: string;
  consumes?: ('application/json' | 'multipart/form-data' | 'text/xml' | 'application/x-www-form-urlencoded')[];
  produces!: ('application/octet-stream' | '*/*')[];
}

export default GenServiceUrlModel;