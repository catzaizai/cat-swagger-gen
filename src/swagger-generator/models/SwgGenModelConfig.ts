import { DefinitionObject } from "../SwaggerConfig";
import GenConfigModel from "../../models/GenConfig.model";

class SwgGenModelConfig {
  definitions!: { [prop: string]: DefinitionObject };
  key!: string;
  config!: GenConfigModel;
  isGeneric?: boolean;
}

export default SwgGenModelConfig;