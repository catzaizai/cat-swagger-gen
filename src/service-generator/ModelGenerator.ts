import BaseModelGenerator from '../model-generator/BaseModelGenerator';
import DataModel from '../model-generator/models/DataModel.model';
class ModelGenerator extends BaseModelGenerator {
  getModel(params: any): DataModel {
    throw new Error('Method not implemented.');
  }
}

export default ModelGenerator;
