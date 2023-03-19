import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma.service";
import { configure } from "./__shared__/config/app.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app); // Enable prisma shutdown hooks to close db properly
  prismaService.applyPrismaMiddleware(); // Apply prisma middleware for delete and find methods,...

  configure(app);

  const port = app.get(ConfigService).get("port");
  const env = app.get(ConfigService).get("env");
  await app.listen(port);
  Logger.log(`Server running on ${port} in ${env}`);
}
bootstrap();
