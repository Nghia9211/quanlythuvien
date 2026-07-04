import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { globalValidationPipe } from "./common/pipes/validation.pipe";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  // Global prefix
  app.setGlobalPrefix("api");

  // CORS
  app.enableCors({
    origin: ["http://localhost:5173", "http://localhost:3001"],
    credentials: true,
  });

  // Global pipes, filters, interceptors
  app.useGlobalPipes(globalValidationPipe);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger - chỉ bật ở development
  if (configService.get("app.nodeEnv") !== "production") {
    const config = new DocumentBuilder()
      .setTitle("DGM Library API")
      .setDescription("Hệ thống quản lý thư viện DGM")
      .setVersion("1.0")
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addSecurityRequirements('access-token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
    logger.log("Swagger: http://localhost:3000/api/docs");
  }

  const port = configService.get<number>("app.port") || 3000;
  await app.listen(port);
  logger.log(`Application running on: http://localhost:${port}/api`);
}

bootstrap();
