import { ClassSerializerInterceptor, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ParentModule } from "./parent/parent.module";
import { PrismaModule } from "./prisma.module";
import { SchoolModule } from "./school/school.module";
import { StudentModule } from "./student/student.module";
import { TransactionModule } from "./transaction/transaction.module";
import { UserModule } from "./user/user.module";
import { appConfig } from "./__shared__/config/app.config";
import { GlobalExceptionFilter } from "./__shared__/filters/global-exception.filter";
import { AuditInterceptor } from "./__shared__/interceptors/audit.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    StudentModule,
    ParentModule,
    SchoolModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
