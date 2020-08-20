export default class GenConfigModel {
  prefix?: string;
  service!: string;
  store?: boolean;
  headers?: any;
  path!: string | string[];
  exclude?: string | string[];
  templateUrl!: string;
  serviceTemplateUrl?: string;
  modelTemplateUrl?: string;
  storeTemplateUrl?: string;
  referenceMap?: {[propName: string]: string};
  map!: { [propName: string]: string };
}
