import {
  ClassSerializerInterceptor,
  Module,
  OnModuleInit,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { AcademicYearModule } from "./academic-year/academic-year.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ClassroomModule } from "./classroom/classroom.module";
import { FeeModule } from "./fee/fee.module";
import { ParentModule } from "./parent/parent.module";
import { PrismaModule } from "./prisma.module";
import { PrismaService } from "./prisma.service";
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
    ClassroomModule,
    FeeModule,
    AcademicYearModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    },
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
export class AppModule implements OnModuleInit {
  constructor(private readonly prismaService: PrismaService) {}
  async onModuleInit() {
    await this.prismaService.seed();
  }
}
