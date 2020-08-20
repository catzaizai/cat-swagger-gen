import * as path from "path";
const { SwgServiceGenerator } = require("../dist");

it("test swgger generator", async () => {
  const filePath = path.join(__dirname, "./service-ci.swg");
  const swg = new SwgServiceGenerator(filePath);
  await swg.setPathDictModel();
});
