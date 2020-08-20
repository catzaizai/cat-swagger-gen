import PropertyModel from "./Property.model";
import ReferenceModel from './Reference.model';

class DataModel {
  fileName!: string;
  filePath!: string;
  description?: string;
  references!: ReferenceModel[];
  className!: string;
  isGeneric?: boolean;
  properties!: PropertyModel[];
}

export default DataModel;