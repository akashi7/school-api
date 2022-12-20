import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { IAppConfig } from "../interfaces/app-config.interface";

/**
 * Defines the application config variables
 * @returns the Application config variables
 */
export function appConfig(): IAppConfig {
  return {
    port: +process.env.PORT,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(","),
    swaggerEnabled: process.env.SWAGGER_ENABLED === "true",
    env: process.env.NODE_ENV,
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  };
}

/**
 * Configures and binds Swagger with the project's application
 * @param app The NestJS Application instance
 */
export function configureSwagger(app: INestApplication): void {
  const API_TITLE = "School Nestpay";
  const API_DESCRIPTION = "API Doc. for School Nestpay API";
  const API_VERSION = "1.0";
  const SWAGGER_URL = "docs/swagger-ui";
  const options = new DocumentBuilder()
    .setTitle(API_TITLE)
    .setDescription(API_DESCRIPTION)
    .setVersion(API_VERSION)
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(SWAGGER_URL, app, document, {
    customSiteTitle: "School Nestpay API",
    customCss: ".swagger-ui .topbar { display: none }",
    swaggerOptions: {
      docExpansion: "none",
      persistAuthorization: true,
      apisSorter: "alpha",
      operationsSorter: "method",
      tagsSorter: "alpha",
    },
  });
}

/**
 * Generates obj for the app's CORS configurations
 * @returns CORS configurations
 */
export function corsConfig(): CorsOptions {
  return {
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Set-Cookie, Cookies",
    credentials: true,
    origin: (origin, callback) => {
      const appConfiguration = appConfig();
      const { allowedOrigins = [] } = appConfiguration;
      const canAllowUndefinedOrigin =
        origin === undefined && appConfiguration.env !== "production";

      if (allowedOrigins.indexOf(origin) !== -1 || canAllowUndefinedOrigin) {
        callback(null, true);
      } else {
        callback(
          new UnauthorizedException(
            `Not allowed by CORS for origin:${origin} on ${appConfiguration.env}`,
          ),
        );
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  };
}

/**
 * Configure app instance
 * @param {INestApplication} app - Application instance
 */
export function configure(app: INestApplication): void {
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix("api/v1");
  app.enableCors(corsConfig());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  configureSwagger(app);
  const configService = app.get(ConfigService);
  const env = configService.get("env");
  if (["development", "staging"].includes(env)) {
    configureSwagger(app);
  }
}
