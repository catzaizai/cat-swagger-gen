import { TextEncoder } from "util";
import * as fs from "fs";
import * as path from "path";

let writeFileFunc: ((filePath: string, content: string) => void) | undefined;

export function setWriteFileFunc(
  func: (filePath: string, content: string) => void
) {
  writeFileFunc = func;
}

export function firstLowerCase(str: string) {
  const worlds = str.split("");
  worlds[0] = worlds[0].toLowerCase();
  return worlds.join("");
}

export function firstUpperCase(str: string) {
  const worlds = str.split("");
  worlds[0] = worlds[0].toUpperCase();
  return worlds.join("");
}

export function getType(paramType?: string) {
  let type: string;
  switch (paramType) {
    case "integer":
    case "double":
    case "int":
    case "long":
      type = "number";
      break;
    case "string":
      type = "string";
      break;
    case "boolean":
      type = "boolean";
      break;
    default:
      type = "any";
      break;
  }
  return type;
}

export function writeFile(filePath: string, content: string) {
  if (writeFileFunc) {
    writeFileFunc(filePath, content);
  } else {
    var uint8array = new TextEncoder().encode(content);
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
    fs.writeFileSync(filePath, uint8array);
  }
}

/**
 * 获取path1 相对于 path2 的路径
 * @param path1
 * @param path2
 */
export function relativeDir(path1: string, path2: string) {
  var rela = path1.split("/");
  rela.shift();
  var abso = path2.split("/");
  abso.shift();

  var num = 0;

  for (var i = 0; i < rela.length; i++) {
    if (rela[i] === abso[i]) {
      num++;
    } else {
      break;
    }
  }

  rela.splice(0, num);
  abso.splice(0, num);

  var str = "";

  for (var j = 0; j < abso.length - 1; j++) {
    str += "../";
  }

  if (!str) {
    str += "./";
  }

  str += rela.join("/");

  return str;
}

export function getTemplateContent(defaultTemplatePath: string, templatePath?: string) {
  let templateContent: Buffer | undefined;
  let filePath = path.join(__dirname, defaultTemplatePath);
  if (templatePath) {
    filePath = templatePath;
  }
  if (fs.existsSync(filePath)) {
    templateContent = fs.readFileSync(filePath);
  } else {
    console.warn(filePath);
    throw new Error(`cat: Con't find the template file!`);
  }
  return templateContent?.toString();
}
