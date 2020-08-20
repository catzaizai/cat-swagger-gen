import BaseModelGenerator from '../model-generator/BaseModelGenerator';
import DataModel from '../model-generator/models/DataModel.model';
import SwgGenModelConfig from './models/SwgGenModelConfig';
import PropertyModel from '../model-generator/models/Property.model';
import ReferenceModel from '../model-generator/models/Reference.model';
import * as path from 'path';
import { getType } from '../utils/index';
import { DefinitionObject } from './SwaggerConfig';

class SwaggerModelGenerator extends BaseModelGenerator<SwgGenModelConfig> {
  getModel(params: SwgGenModelConfig): DataModel {
    const { config } = params;
    const { key, definitions, pattern } = this.getPattern(params);
    const dataModel = new DataModel();
    dataModel.className = key;
    const model = definitions[key];
    const properties: PropertyModel[] = [];
    const references: ReferenceModel[] = [];
    if (config.referenceMap) {
      const prop = Object.keys(config.referenceMap).find((x) => x === (config.map[key] || key));
      if (prop) {
        dataModel.className = prop;
        return dataModel;
      }
    }
    if (model) {
      dataModel.className = this.getClassName(config.map[key] || key);
      if (pattern) {
        dataModel.isGeneric = true;
      }
      dataModel.fileName = this.getFilename(config.map[key] || key);
      dataModel.filePath = path.join(this._baseModelDir, dataModel.fileName);
      dataModel.description = key;

      if (model.properties) {
        Object.keys(model.properties).forEach((prop) => {
          let type = 'any';
          const property = model.properties![prop];
          switch (property.type) {
            case 'array':
              if (property.items) {
                let ref = property.items!.$ref;
                if (ref) {
                  const referenceType = this.getReferenceType(ref, params);
                  if (referenceType.reference) {
                    if (!references.find((x) => x.className === referenceType.reference.className)) {
                      references.push(referenceType.reference);
                    }
                  }
                  type = `${referenceType.type || 'any'}[]`;
                } else {
                  type = `${property.items!.type || 'any'}[]`;
                }
              } else {
                type = `${property.type}[]`;
              }
              break;
            case 'integer':
            case 'number':
              type = 'number';
              break;
            case 'boolean':
              type = 'boolean';
              break;
            case 'string':
              if (property.enum) {
                type = (property.enum || []).map((x) => `'${x}'`).join('|');
              } else {
                type = 'string';
              }
              break;
            default:
              if (property.$ref) {
                const referenceType = this.getReferenceType(property.$ref, params);
                if (referenceType.reference) {
                  if (!references.find((x) => x.className === referenceType.reference.className)) {
                    references.push(referenceType.reference);
                  }
                }
                type = referenceType.type;
              } else {
                type = property.type || 'any';
              }
          }

          properties.push({
            name: prop,
            type,
            description: property.description,
            required: !!(model.required || []).find((x) => x === prop),
          });
        });
      }
      dataModel.properties = properties;
      dataModel.references = references;
    }
    return dataModel;
  }

  getReferenceType(ref: string, params: SwgGenModelConfig) {
    const { definitions, key, config } = params;
    ref = ref.replace('#/definitions/', '');
    if (ref === key) {
      return { type: config.map[key] || this.getClassName(key) };
    }
    const model = this.getModel({ definitions, key: ref, config });
    this.createModel(model);
    let type = model.className;
    if (model.isGeneric) {
      let pattern = (/(?<=[<«]).*?(?=[»>])/.exec(ref) || [])[0];
      pattern = getType(pattern);
      type = `${type}<${pattern}>`;
    }
    return {
      reference: { className: model.className, relativePath: `./${model.fileName.replace(/\.ts$/, '')}` },
      type,
    };
  }

  getPattern(params: SwgGenModelConfig) {
    let { definitions, key } = params;
    let pattern: string = '';
    let newKey = key;
    if (['List', 'Map'].findIndex((x) => x === key) === -1) {
      const regExp = /(?<=[<«]).*?(?=[»>])/;
      const match = regExp.exec(key);
      if (match) {
        newKey = key.match(/.*?(?=[<«])/)![0];
        pattern = getType(match[0]);
      }

      const similar = this.getSimilar(newKey, definitions);
      if (similar) {
        definitions[newKey] = definitions[similar];
        pattern = newKey;
      }

      if (similar && definitions[newKey]) {
        this.setPatternProperty(definitions[similar], newKey, similar);
      }
    }

    return { key: newKey, definitions, pattern };
  }

  setPatternProperty(obj: DefinitionObject, key: string, similar: string) {
    const reg = new RegExp(`${key}([<«](.*?)[»>])?`);
    const mat = reg.exec(similar);
    if (mat && mat[2]) {
      try {
        Object.keys(obj.properties!).forEach((prop: string) => {
          let ref = obj.properties![prop]?.$ref || '';
          let type = obj.properties![prop]?.type;
          let realType: string | undefined;

          let newType: string = 'T';
          switch (type) {
            case 'array':
              ref = obj.properties![prop]?.items?.$ref || '';
              if (ref) {
                realType = ref.replace('#/definitions/', '');
              }
              newType = 'T[]';
              break;
            case 'integer':
              realType = 'int';
              break;
            default:
              break;
          }
          if (realType && realType === mat[2]) {
            if (realType === 'int' && prop === 'code') { // Hardcode 不是很好 还没想好怎么处理范型的问题
              return;
            }
            obj.properties![prop]!.$ref = undefined;
            obj.properties![prop]!.type = newType;
            // obj.properties![prop]!.items = undefined;
          }
        });
      } catch (error) {
        console.error(key);
      }
    }
  }

  getSimilar(key: string, definitions: { [name: string]: DefinitionObject }) {
    return Object.keys(definitions).find((x) => {
      const reg = new RegExp(`${key}([<«](.*?)[»>])?`);
      const mat = reg.exec(x);
      if (mat && mat[2] === 'Void') {
        return false;
      }
      return mat && mat[0] !== key;
    });
  }
}

export default SwaggerModelGenerator;
