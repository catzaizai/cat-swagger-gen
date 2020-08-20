import ReferenceModel from "../../model-generator/models/Reference.model";
import GenServiceModel from "../../service-generator/models/GenService.model";
import GenServiceReferenceModel from "../../service-generator/models/GenServiceReference.model";

class GenStoreModel {
  filePath!: string;
  fileName!: string;
  services!: GenServiceModel[];
  references!: GenServiceReferenceModel[];
  commonReferences!: ReferenceModel[];
}

export default GenStoreModel;