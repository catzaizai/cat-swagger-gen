import BaseServiceGenerator from '../service-generator/BaseServiceGenerator';
import GenServiceModel from '../service-generator/models/GenService.model';
import * as path from 'path';
import getSwaggerJson from './getSwaggerJson';
import { SwaggerConfigModel, RequestObject, ObjectType } from './SwaggerConfig';
import GenServiceUrlModel from '../service-generator/models/GenServiceUrl.model';
import { getType, firstUpperCase } from '../utils/index';
import SwaggerModelGenerator from './SwgModelGenerator';
import SwgGenModelConfig from './models/SwgGenModelConfig';
import GenServiceReferenceModel from '../service-generator/models/GenServiceReference.model';

class SwgServiceGenerator extends BaseServiceGenerator {
  private swaggerConfigModel?: SwaggerConfigModel;

  async setPathDictModel() {
    if (this.config) {
      await this.getUrlObjectList();
      this.createServices();
    }
  }

  private async getUrlObjectList() {
    const config = this.config!;
    this.swaggerConfigModel = await getSwaggerJson(config.service, config.headers);
    if (this.swaggerConfigModel) {
      if (typeof config.path === 'string') {
        this.getUrlObjItem(config!.path.toString());
      } else if (config.path instanceof Array) {
        config.path.forEach((path) => this.getUrlObjItem(path));
      } else {
        console.error('请检查path配置');
      }
    }
  }

  private getUrlObjItem(basePath: string) {
    const hasAs = basePath.split(/ +as +/);
    basePath = hasAs[0];
    Object.keys(this.swaggerConfigModel!.paths)
      .filter((x) => this.checkUrl(basePath, x))
      .forEach((prop) => {
        const paths = basePath.split('/').filter((x) => x);
        const fileName = this.getFilename(hasAs[1] || paths);
        if (!this.pathDict[fileName]) {
          const model = new GenServiceModel();
          model.fileName = fileName;
          model.className = this.getClassName(hasAs[1] || paths);
          model.filePath = path.join(this.baseDir, fileName);
          model.urlObjs = [];
          model.references = [];
          this.pathDict[fileName] = model;
        }
        const obj = this.swaggerConfigModel!.paths[prop];
        Object.keys(obj).forEach((method) => {
          const urlModel = new GenServiceUrlModel();
          const request = (obj as any)[method] as RequestObject;
          const response = request.responses[200] || {};
          urlModel.methodName = request.operationId.replace(/Using(POST|GET|PUT|DELETE)(_\d+){0,1}$/, '');
          urlModel.method = method;
          urlModel.path = prop;
          urlModel.summary = request.summary;
          urlModel.result = this.getObjectType(response.type, response.schema, fileName);
          urlModel.consumes = request.consumes;
          urlModel.produces = request.produces;
          urlModel.parameters = (request.parameters || [])
            .sort((x) => (x.required ? 1 : -1))
            .map((param) => ({
              name: param.name,
              in: param.in,
              description: param.description,
              required: param.required,
              type: this.getObjectType(param.type, param.schema, fileName),
            }));
          if (this.pathDict[fileName].urlObjs.find((x) => x.methodName === urlModel.methodName)) {
            urlModel.methodName = `${urlModel.methodName}${firstUpperCase(urlModel.method)}`;
          }
          this.pathDict[fileName].urlObjs.push(urlModel);
        });
      });
  }

  private checkUrl(basePath: string, targetPath: string) {
    const regBase = RegExp(`^${basePath}`);
    const regPath = RegExp(`^${basePath}(?=/)`);
    let exclude = this.config!.exclude;
    if (exclude) {
      if (typeof exclude === 'string') {
        exclude = [exclude];
      }
      for (const excludePath of exclude) {
        const excludeReg = RegExp(`^${basePath}${excludePath}`);
        return !excludeReg.test(targetPath);
      }
    }
    return regBase.test(targetPath) || regPath.test(targetPath);
  }

  private getObjectType(pType?: string, schema?: ObjectType, fileName?: string, extendType?: string) {
    let type = 'any';
    if (pType) {
      type = getType(pType);
    } else if (schema) {
      let ref = schema?.$ref || schema.items?.$ref || '';
      if (ref) {
        const references = this.getReferences(ref, fileName!);
        references.genServiceReferences.forEach((item) => {
          if (!this.pathDict[fileName!].references.find((x) => x.className === item.className)) {
            this.pathDict[fileName!].references.push(item);
          }
        });
        this.pathDict[fileName!].references.concat(references.genServiceReferences);
        type = references.type;
      } else {
        type = this.getObjectType(schema.items?.type, schema.items?.items, fileName);
      }
      if (schema.type === 'array') {
        type = `${type}[]`;
      }
    }

    return type;
  }

  private getReferences(ref: string, fileName: string) {
    const genServiceReferences: GenServiceReferenceModel[] = [];
    ref = this.replaceRef(ref);
    ref = ref.replace(/[\u4e00-\u9fa5（）()-\w_]+/g, (value) => {
      const modelgenerator = new SwaggerModelGenerator(this.baseDir, this.config!.modelTemplateUrl!);
      const genModelConfig = new SwgGenModelConfig();
      genModelConfig.config = this.config!;
      genModelConfig.definitions = this.swaggerConfigModel!.definitions;
      genModelConfig.key = value;
      let genModel = modelgenerator.getModel(genModelConfig);
      genModel = modelgenerator.createModel(genModel);
      if (genModel.filePath) {
        const genServiceReference = new GenServiceReferenceModel();
        genServiceReference.className = genModel.className;
        genServiceReference.relativePath = this.getRelative(genModel, this.pathDict[fileName].filePath);
        genServiceReferences.push(genServiceReference);
      } else {
        if (this.config!.referenceMap && this.config!.referenceMap![genModel.className]) {
          const genServiceReference = new GenServiceReferenceModel();
          genServiceReference.className = genModel.className;
          genServiceReference.relativePath = this.config!.referenceMap![genModel.className];
          genServiceReferences.push(genServiceReference);
        }
      }
      return genModel.className;
    });
    ref = ref.replace(/List<([\u4e00-\u9fa5\w_]+)>/g, '$1[]');
    return { genServiceReferences, type: ref };
  }

  private replaceRef(ref: string) {
    ref = ref.replace(/^#\/definitions\//, '');
    ref = ref.replace(/»/g, '>');
    ref = ref.replace(/«/g, '<');
    ref = ref.replace('Void', 'void');
    ref = ref.replace('object', 'any');
    ref = ref.replace(/long|int/, 'number');
    return ref;
  }
}

export default SwgServiceGenerator;
