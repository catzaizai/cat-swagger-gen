import * as http from 'http';
import * as https from 'https';
import { SwaggerConfigModel } from './SwaggerConfig';

export default (url: string, headers: any) => {
  return new Promise<SwaggerConfigModel>((resolve: any, reject: any) => {
    let client: any = https;
    const match = /^(https?:)\/\/(.*?)(?::(\d+))?(\/.*)/.exec(url) || [];
    const protocol = match[1] || 'http:';
    const hostname = match[2];
    const port = match[3]
    const path = match[4];

    if (protocol === 'http:') {
      client = http;
    }
    client
      .get(
        {
          protocol,
          path: path,
          hostname: hostname,
          port: Number(port),
          headers,
        },
        (res: http.IncomingMessage) => {
          const { statusCode } = res;
          const contentType = res.headers['content-type'];
          let error;
          if (statusCode !== 200) {
            error = new Error(`请求失败\n状态码：${statusCode}`);
          } else if (!/^application\/json/.test(contentType!)) {
            error = new Error(`无效的 content-type.\n期望的是 application/json 但接收到的是 ${contentType}`);
          }
          if (error) {
            console.error(error.message);
            res.resume();
            reject(error);
            return;
          }
          res.setEncoding('utf8');
          let rawData = '';
          res.on('data', chunk => {
            rawData += chunk;
          });
          res.on('end', () => {
            try {
              const parsedData = JSON.parse(rawData);
              resolve(parsedData);
            } catch (e) {
              console.error(e.message);
              reject(e);
            }
          });
        }
      )
      .on('error', (e: any) => {
        console.error(`出现错误：${e.message}`);
        reject(e);
      });
  });
};
