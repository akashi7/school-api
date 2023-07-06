import {
  ClassSerializerInterceptor,
  Module,
  OnModuleInit,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { appConfig } from "./__shared__/config/app.config";
import { GlobalExceptionFilter } from "./__shared__/filters/global-exception.filter";
import { AuditInterceptor } from "./__shared__/interceptors/audit.interceptor";
import { AcademicYearModule } from "./academic-year/academic-year.module";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ClassroomModule } from "./classroom/classroom.module";
import { DeductibleModule } from "./deductible/deductible.module";
import { EmployeeModule } from "./employee/employee.module";
import { FeeModule } from "./fee/fee.module";
import { ParentModule } from "./parent/parent.module";
import { PaymentModule } from "./payment/payment.module";
import { PrismaModule } from "./prisma.module";
import { PrismaService } from "./prisma.service";
import { SchoolModule } from "./school/school.module";
import { StudentModule } from "./student/student.module";
import { PositionModule } from './position/position.module';
import { DeductibleTypeModule } from './deductible-type/deductible-type.module';
import { InstallmentModule } from './installment/installment.module';

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
    ClassroomModule,
    FeeModule,
    AcademicYearModule,
    PaymentModule,
    EmployeeModule,
    DeductibleModule,
    PositionModule,
    DeductibleTypeModule,
    InstallmentModule,
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
