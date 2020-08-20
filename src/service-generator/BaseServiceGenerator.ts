import GenServiceModel from './models/GenService.model';
import * as art from 'art-template';
import * as fs from 'fs';
import { writeFile, firstUpperCase, relativeDir, firstLowerCase, getTemplateContent, setWriteFileFunc } from '../utils/index';
import GenServiceParamModel from './models/GenServiceParam.model';
import GenConfigModel from '../models/GenConfig.model';
import * as path from 'path';
import DataModel from '../model-generator/models/DataModel.model';
import GenServiceUrlModel from './models/GenServiceUrl.model';
import PropertyModel from '../model-generator/models/Property.model';
import ModelGenerator from './ModelGenerator';
import GenServiceReferenceModel from './models/GenServiceReference.model';
import BaseStoreGenerator from '../store-generator/BaseStoreGenerator';
import BaseGenerator from '../base-generator/BaseGenerator';

abstract class BaseServiceGenerator<T = any> extends BaseGenerator {
  protected baseDir: string;
  protected config?: GenConfigModel;
  protected pathDict: { [prop: string]: GenServiceModel } = {};

  protected defaultTemplatePath: string = 'templates/service.tmpl';

  constructor(filePath: string, createFileFunc?: ((filePath: string, content: string) => void)) {
    super();
    this.baseDir = path.dirname(filePath);
    if (createFileFunc) {
      setWriteFileFunc(createFileFunc);
    }
    try {
      const result = fs.readFileSync(filePath);
      this.config = JSON.parse(result.toString());
      this.templatePath = this.config?.serviceTemplateUrl;
      if (this.config!.prefix) {
        this.baseDir = path.join(this.baseDir, this.config!.prefix);
      }
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir);
      }
    } catch(e) {
      throw e;
    }
  }

  abstract setPathDictModel(params: T): void | Promise<void>;

  createServices() {
    const models: GenServiceModel[] = [];
    Object.keys(this.pathDict).forEach((prop) => models.push(this.pathDict[prop]));
    models.forEach((model) => this.createServiceFile(model));
    if (this.config!.store) {
      const genStore = new BaseStoreGenerator(this.baseDir, this.config!);
      genStore.createStores(models);
    }
  }

  createServiceFile(model: GenServiceModel) {
    model.urlObjs.forEach((urlObj) => {
      const params = this.mergeParams(urlObj, model.fileName);
      let isDefault = true;
      if (params.length !== urlObj.parameters.length) {
        isDefault = false;
        urlObj.parameters = params;
      }
      this.extendConfig(urlObj);
      urlObj.path = this.getPath(urlObj.path, urlObj.parameters);
      urlObj.params = this.getParams(urlObj.parameters);
      urlObj.query = this.getQuery(urlObj.parameters, isDefault);
      urlObj.body = this.getBody(urlObj.parameters);
      urlObj.annotation = this.getAnnotation(urlObj.parameters);
      urlObj.extendConfig = this.getConfig(urlObj.parameters, urlObj);
      const configs = [];
      if (urlObj.query) {
        configs.push(`params: ${urlObj.query}`);
      }
      if ((urlObj.method === 'delete' || urlObj.method === 'get') && urlObj.body) {
        configs.push(`data: ${urlObj.body}`);
        urlObj.body = undefined;
      }
      if (urlObj.extendConfig) {
        configs.push(urlObj.extendConfig);
      }
      urlObj.config = configs.join(', ');
    });
    const content = this.renderContent(model);
    writeFile(model.filePath, content);
    return model;
  }

  protected getFilename(names: string[] | string) {
    if (typeof names === 'string') {
      return `${names}.service.ts`;
    }
    return names.map((x, index) => (index === 0 ? x : firstUpperCase(x))).join('') + '.service.ts';
  }

  protected getClassName(names: string[] | string) {
    if (typeof names === 'string') {
      return `${firstUpperCase(names)}Service`;
    }
    return names.map((x) => firstUpperCase(x)).join('') + 'Service';
  }

  protected getRelative(genModel: DataModel, pathB: string) {
    const path = relativeDir(genModel.filePath, pathB);
    return path.replace(/\.ts$/, '');
  }

  private renderContent(model: GenServiceModel) {
    const templateContent = getTemplateContent(this.defaultTemplatePath, this.templatePath);
    const content = art.render(templateContent, {
      prefix: this.config!.prefix,
      className: model.className,
      urlObjs: model.urlObjs,
      references: model.references,
      commonReferences: model.commonReferences,
    });
    return content;
  }

  private getPath(path: string, parameters: GenServiceParamModel[]) {
    (parameters || [])
      .filter((x) => x.in === 'path')
      .forEach((item) => {
        path = path.replace(`{${item.name}}`, `\${${item.name}}`);
      });
    return path;
  }

  private getParams(parameters: GenServiceParamModel[]) {
    return (parameters || [])
      .sort((x) => (x.required ? -1 : 1))
      .map((item) => {
        return `${item.name}${item.required ? '' : '?'}: ${item.type}${item.default ? '=' + item.default : ''}`;
      })
      .join(', ');
  }

  private getQuery(parameters: GenServiceParamModel[], isDefault: boolean) {
    const query = (parameters || [])
      .filter((x) => x.in === 'query')
      .map((item) => item.name)
      .join(', ');
    return isDefault && query ? `{ ${query} }` : query;
  }

  private getConfig(parameters: GenServiceParamModel[], urlObj: GenServiceUrlModel) {
    let configs = (parameters || []).filter((x) => x.in === 'config').map((item) => `...${item.name}`);
    if ((urlObj.consumes || []).find((x) => x === 'multipart/form-data')) {
      configs.push(`headers: { 'Content-Type': 'multipart/form-data' }`);
    }
    return configs.join(', ');
  }

  private getBody(parameters: GenServiceParamModel[]) {
    return (parameters || [])
      .filter((x) => x.in === 'body' || x.in === 'formData')
      .map((item) => item.name)
      .join(',');
  }

  private getAnnotation(parameters: GenServiceParamModel[]) {
    let annotation = (parameters || [])
      .sort((x) => (x.required ? 1 : 0))
      .map((item) => {
        return `   * @param ${item.name} ${item.description}`;
      })
      .join('\n');
    if (annotation) {
      annotation = '\n' + annotation + '\n  ';
    }
    return annotation;
  }

  private mergeParams(urlObj: GenServiceUrlModel, fileName: string) {
    const query = (urlObj.parameters || []).filter((x) => x.in === 'query');
    const parameters = (urlObj.parameters || []).filter((x) => x.in !== 'query');
    if (query.length >= 3) {
      let dataModel = new DataModel();
      const name = firstUpperCase(urlObj.methodName);
      dataModel.className = name + 'Model';
      dataModel.description = '查询条件';
      dataModel.fileName = name + '.model.ts';
      dataModel.filePath = path.join(this.baseDir, 'models', dataModel.fileName);
      dataModel.properties = [];
      query.forEach((x) => {
        const property = new PropertyModel();
        property.required = x.required;
        property.name = x.name;
        property.description = x.description;
        property.type = x.type;
        dataModel.properties.push(property);
      });
      const dataGenerator = new ModelGenerator(this.baseDir, this.config!.modelTemplateUrl!);
      dataModel = dataGenerator.createModel(dataModel);
      if (!this.pathDict[fileName].references) {
        this.pathDict[fileName].references = [];
      }
      const reference = new GenServiceReferenceModel();
      reference.className = dataModel.className;
      reference.relativePath = this.getRelative(dataModel, this.pathDict[fileName].filePath);
      if (!this.pathDict[fileName].references.find((x) => x.className === reference.className)) {
        this.pathDict[fileName].references.push(reference);
      }

      const params = new GenServiceParamModel();
      params.type = dataModel.className;
      params.required = true;
      params.in = 'query';
      params.name = firstLowerCase(dataModel.className);
      params.description = dataModel.description;
      parameters.push(params);
      return parameters;
    }
    return urlObj.parameters || [];
  }

  private extendConfig(urlObj: GenServiceUrlModel) {
    if (urlObj.result === 'any') {
      const newParam = new GenServiceParamModel();
      newParam.in = 'config';
      newParam.name = 'config';
      newParam.required = false;
      newParam.type = 'any';
      newParam.description = 'AxiosRequestConfig';
      urlObj.parameters.push(newParam);
    }
    return urlObj;
  }
}

export default BaseServiceGenerator;
