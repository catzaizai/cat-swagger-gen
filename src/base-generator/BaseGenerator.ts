import GenConfigModel from '../models/GenConfig.model';

abstract class BaseGenerator<T = any> {

  protected templatePath: string | undefined;
  protected abstract defaultTemplatePath: string;
  protected config?: GenConfigModel;
}

export default BaseGenerator;
