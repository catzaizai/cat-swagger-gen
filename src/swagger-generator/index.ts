import SwgServiceGenerator from './SwgServiceGenerator';

export default async (filePath: string) => {
  const swgServiceGenerator = new SwgServiceGenerator(filePath);
  await swgServiceGenerator.setPathDictModel();
};
