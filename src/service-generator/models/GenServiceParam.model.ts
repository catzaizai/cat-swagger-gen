class GenServiceParamModel {
  name!: string;
  in!: 'path' | 'query' | 'body' | 'config' | 'formData';
  description?: string;
  required?: boolean;
  type!: string;
  default?: string;
}

export default GenServiceParamModel;
