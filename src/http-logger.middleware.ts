import { Injectable, NestMiddleware } from "@nestjs/common";

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    res.on("finish", () => {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode}`);
    });
    next();
  }
}
