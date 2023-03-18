import {
  ClassSerializerInterceptor,
  Module,
  OnModuleInit,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { AcademicYearModule } from "./academic-year/academic-year.module";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ClassroomModule } from "./classroom/classroom.module";
import { FeeModule } from "./fee/fee.module";
import { ParentModule } from "./parent/parent.module";
import { PaymentModule } from "./payment/payment.module";
import { StripeModule } from "./payment/stripe.module";
import { PrismaModule } from "./prisma.module";
import { PrismaService } from "./prisma.service";
import { SchoolModule } from "./school/school.module";
import { StudentModule } from "./student/student.module";
import { TransactionModule } from "./transaction/transaction.module";
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
    StudentModule,
    ParentModule,
    SchoolModule,
    TransactionModule,
    ClassroomModule,
    FeeModule,
    AcademicYearModule,
    PaymentModule,
    StripeModule.forRoot(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2022-11-15",
    }),
  ],
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
