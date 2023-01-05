import {
  Global,
  INestApplication,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";
import { IAppConfig } from "./__shared__/interfaces/app-config.interface";

@Injectable()
@Global()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly configService: ConfigService<IAppConfig>) {
    super({ datasources: { db: { url: configService.get("databaseUrl") } } });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on("beforeExit", async () => {
      await app.close();
    });
  }
}
