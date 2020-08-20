import * as path from "path";
import * as fs from "fs";
import GenConfigModel from "../models/GenConfig.model";
import GenStoreModel from "./models/GenStore.model";
import {
  writeFile,
  relativeDir,
  firstLowerCase,
  getTemplateContent,
} from "../utils/index";
import * as art from "art-template";
import GenServiceReferenceModel from "../service-generator/models/GenServiceReference.model";
import ReferenceModel from "../model-generator/models/Reference.model";
import GenServiceModel from "../service-generator/models/GenService.model";
import GenServiceParamModel from "../service-generator/models/GenServiceParam.model";
import BaseGenerator from "../base-generator/BaseGenerator";

class BaseStoreGenerator extends BaseGenerator {

  protected baseDir: string;
  protected config?: GenConfigModel;
  protected genStore?: GenStoreModel;
  protected defaultTemplatePath: string = "templates/store.tmpl";

  private _classTypes: GenServiceParamModel[] = [];
  private _serviceReference: ReferenceModel[] = [];
  private _filePath: string = "";
  private _fileName: string = "genStore.ts";

  constructor(baseDir: string, config: GenConfigModel) {
    super();
    this.baseDir = baseDir;
    this.config = config;
    this.templatePath = config.storeTemplateUrl;
    this._filePath = path.join(this.baseDir, "store", this._fileName);
  }

  createStores(services: GenServiceModel[]) {
    this.getClassTypes(services);
    const model = new GenStoreModel();
    model.fileName = this._fileName;
    model.filePath = this._filePath;
    model.references = this.getRenferences<GenServiceReferenceModel>(
      services,
      "references"
    );
    model.services = services;
    this._serviceReference.forEach((item) => model.references.push(item));
    model.commonReferences = this.getRenferences<ReferenceModel>(
      services,
      "commonReferences"
    );
    this.createStoreFiles(model);
  }

  private createStoreFiles(model: GenStoreModel) {
    const content = this.renderContent(model);
    writeFile(model.filePath, content);
  }

  private renderContent(model: GenStoreModel) {
    const templateContent = getTemplateContent(this.defaultTemplatePath, this.templatePath);
    const content = art.render(templateContent, {
      references: model.references,
      commonReferences: model.commonReferences,
      services: model.services,
      firstLowerCase: firstLowerCase,
      getParams: this.getParams,
    });
    return content;
  }

  private getRenferences<T>(
    list: GenServiceModel[],
    name: "references" | "commonReferences"
  ) {
    const references = list.reduce(
      (prev: GenServiceReferenceModel[], next) => prev.concat(next[name] || []),
      []
    );

    const referencesDict: any = {};
    references.forEach((item) => {
      if (this.checkClassType(item.className)) {
        const ref = new ReferenceModel();
        ref.className = item.className;
        ref.relativePath = `.${item.relativePath}`;
        referencesDict[item.className] = ref;
      }
    });
    return Object.keys(referencesDict).map((x) => referencesDict[x]) as T[];
  }

  private getClassTypes(list: GenServiceModel[]) {
    this._classTypes = [];
    this._serviceReference = [];
    list.forEach((item) => {
      item.urlObjs.forEach((url) => {
        url.parameters.forEach((p) => {
          this._classTypes.push(p);
        });
      });
      const reference = new ReferenceModel();
      reference.className = firstLowerCase(item.className);
      reference.relativePath = this.getRelative(item.filePath, this._filePath);
      this._serviceReference.push(reference);
    });
  }

  private checkClassType(typeName: string) {
    if (this._classTypes.find((x) => x.type === typeName)) {
      return true;
    }
    return false;
  }

  private getRelative(pathA: string, pathB: string) {
    const path = relativeDir(pathA, pathB);
    return path.replace(/\.ts$/, "");
  }

  private getParams(parameters: GenServiceParamModel[]) {
    return (parameters || [])
      .map((item) => {
        return item.name;
      })
      .join(", ");
  }
}

export default BaseStoreGenerator;
