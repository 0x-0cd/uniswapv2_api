"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
require("dotenv/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = process.env.PORT ?? 3000;
    const config = new swagger_1.DocumentBuilder()
        .setTitle('UniswapV2 API')
        .setDescription('A series of APIs to fetch information from UniswapV2')
        .setVersion('0.0.1')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    await app.listen(port);
    new common_1.Logger(app_module_1.AppModule.name).debug(`Server Listening on Port: ${port}`);
    new common_1.Logger(app_module_1.AppModule.name).debug(`Swagger API Doc @ http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map