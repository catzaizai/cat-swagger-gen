## Swagger 服务生成器

用法

``` ts
const filePath = path.join(__dirname, './config.swg');
const swg = new SwgServiceGenerator(filePath);
await swg.setPathDictModel();
```

`config.swg`

``` js

{
  "service": "https://xxxx/v2/api-docs", // swagger 文档地址
  "store": true, // 是否生成 store
  "headers": {
    "Cookie": "" // 获取swagger文档的cookie
  },
  "prefix": "/api", // 服务前缀
  "path": [
    "/api/commodity as commodify" // 生成的服务加别名
  ],
  "storeTemplateUrl": "/path/store.tmpl", // 绝对路径，后面优化
  "referenceMap": {
    "ResultModel": "../../models/common/Result.model", // 外部依赖
    "PageResultModel": "../../models/common/PageResult.model"
  },
  "map": {
    "返回结果": "ResultModel", // 中英文映射
    "分页结果": "PageResultModel",
  }
}

```