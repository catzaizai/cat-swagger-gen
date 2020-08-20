import GenServiceUrlModel from "./GenServiceUrl.model";
import GenServiceReferenceModel from "./GenServiceReference.model";
import ReferenceModel from "../../model-generator/models/Reference.model";

class GenServiceModel {
  fileName!: string;
  filePath!: string;
  className!: string;
  urlObjs!:  GenServiceUrlModel[];
  references!: GenServiceReferenceModel[];
  commonReferences!: ReferenceModel[];
}

export default GenServiceModel;