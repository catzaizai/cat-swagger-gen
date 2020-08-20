import DataModel from './models/DataModel.model';
import * as path from 'path';
import * as fs from 'fs';
import * as art from 'art-template';
import { writeFile, getTemplateContent } from '../utils';
import BaseGenerator from '../base-generator/BaseGenerator';

abstract class BaseModelGenerator<T = any> extends BaseGenerator {
  _modelPaths: DataModel[] = [];
  _baseDir: string = '/';
  _baseModelDir: string = '/';

  protected defaultTemplatePath = 'templates/model.tmpl';

  constructor(baseDir: string, templatePath?: string) {
    super();
    this.templatePath = templatePath;
    this._baseDir = baseDir;
    this._baseModelDir = path.join(baseDir, 'models');
    if (!fs.existsSync(this._baseModelDir)) {
      fs.mkdirSync(this._baseModelDir);
    }
  }

  abstract getModel(params: T): DataModel;

  createModel(dataModel: DataModel): DataModel {
    const oldModel = this.findModel(dataModel.filePath);
    if (oldModel) {
      return oldModel;
    }
    const content = this.renderModelContent(dataModel);
    if (dataModel.filePath) {
      writeFile(dataModel.filePath, content);
    }
    return dataModel;
  }

  findModel(filePath: string) {
    return this._modelPaths.find(x => x.filePath === filePath);
  }

  protected getFilename(name: string) {
    return (name || '').replace(/[Mm]odel$/, '') + '.model.ts';
  }

  protected getClassName(name: string) {
    if (/Model$/.test(name)) {
      return name;
    }
    return name + 'Model';
  }

  private renderModelContent(model: DataModel) {
    const templateContent = getTemplateContent(this.defaultTemplatePath, this.templatePath);
    const content = art.render(templateContent, {
      className: model.className,
      description: model.description,
      properties: model.properties,
      references: model.references,
      isGeneric: model.isGeneric
    });
    return content;
  }
}

export default BaseModelGenerator;
