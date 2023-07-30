import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
import {
  CreatedResponse,
  OkResponse,
  PageResponse,
  Paginated,
  PaginationParams,
} from "../__shared__/decorators";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { IPagination } from "../__shared__/interfaces/pagination.interface";
import { Auth } from "../auth/decorators/auth.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import {
  FindFeesByStudentDto,
  FindPaymentsByStudentDto,
} from "../fee/dto/find-fees.dto";
import { PayFeeDto, PayFeeWithThirdPartyDto } from "../fee/dto/pay-fee.dto";
import { FeeService } from "../fee/fee.service";
import { PaymentService } from "../payment/payment.service";
import { CreateExtraFeeDto } from "./dto/create-extra-fee.dto";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { CreateStudentDto } from "./dto/create-student.dto";
import { StudentSearchDto } from "./dto/student-search.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentService } from "./student.service";

@Controller("students")
@ApiTags("Students")
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly feeService: FeeService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @Auth(ERole.SCHOOL)
  @CreatedResponse()
  async createStudent(@Body() dto: CreateStudentDto, @GetUser() user: User) {
    const payload = await this.studentService.create(dto, user);
    return new GenericResponse("Student created", payload);
  }

  @Get()
  @Auth(ERole.SCHOOL, ERole.ADMIN, ERole.RELATIVE)
  @Paginated()
  @PageResponse()
  async getStudents(
    @Query() dto: StudentSearchDto,
    @PaginationParams() options: IPagination,
    @GetUser() user: User,
  ) {
    const payload = await this.studentService.findAll(dto, options, user);
    return new GenericResponse("Students retrieved", payload);
  }

  @Get(":id")
  @Auth(ERole.PARENT, ERole.SCHOOL, ERole.STUDENT, ERole.RELATIVE)
  @OkResponse()
  async getStudent(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.studentService.findOne(id, user);
    return new GenericResponse("Student retrieved", payload);
  }

  @Get(":id/fees")
  @Auth(ERole.PARENT, ERole.SCHOOL, ERole.STUDENT, ERole.RELATIVE)
  @OkResponse()
  async findFeesByStudent(
    @Param("id") id: string,
    @Query() dto: FindFeesByStudentDto,
    @GetUser() user: User,
  ) {
    const payload = await this.feeService.findFeesByStudent(id, dto, user);
    return new GenericResponse("Student fees retrieved", payload);
  }

  @Get(":id/payments")
  @Auth(ERole.PARENT, ERole.SCHOOL, ERole.STUDENT, ERole.RELATIVE)
  @Paginated()
  @PageResponse()
  async findPaymentsByStudent(
    @Param("id") id: string,
    @Query() dto: FindPaymentsByStudentDto,
    @GetUser() user: User,
    @PaginationParams() options: IPagination,
  ) {
    const payload = await this.paymentService.findPaymentsByStudent(
      id,
      dto,
      user,
      options,
    );
    return new GenericResponse("Student payments retrieved", payload);
  }

  @Post(":studentId/fees/:feeId/pay")
  @Auth(ERole.SCHOOL)
  async payFee(
    @Param("studentId") studentId: string,
    @Param("feeId") feeId: string,
    @Body() dto: PayFeeDto,
    @GetUser() user: User,
  ) {
    const payload = await this.paymentService.addFeePayment(
      studentId,
      feeId,
      dto,
      user,
    );
    return new GenericResponse("Fee paid", payload);
  }

  @Post(":studentId/pay")
  @Auth(ERole.SCHOOL)
  async payByStudent(
    @Param("studentId") studentId: string,
    @Body() dto: PayFeeDto,
    @GetUser() user: User,
  ) {
    const payload = await this.paymentService.addPayment(studentId, dto, user);
    return new GenericResponse("Student payment initiated", payload);
  }

  /**
   * Pay specific fee with third party
   * @param studentId
   * @param feeId
   * @param dto
   * @param user
   * @returns
   */
  @Post(":studentId/fees/:feeId/pay/third-party")
  @Auth()
  async payFeeWithThirdParty(
    @Param("studentId") studentId: string,
    @Param("feeId") feeId: string,
    @Body() dto: PayFeeWithThirdPartyDto,
    @GetUser() user: User,
  ) {
    const payload = await this.paymentService.payFeeWithThirdParty(
      studentId,
      feeId,
      dto,
      user,
    );
    return new GenericResponse("Fee payment initiated", payload);
  }

  /**
   * Pay custom amount with third party
   * @param studentId
   * @param feeId
   * @param dto
   * @param user
   * @returns
   */
  @Post(":studentId/pay/third-party")
  @Auth()
  async payWithThirdParty(
    @Param("studentId") studentId: string,
    @Body() dto: PayFeeWithThirdPartyDto,
    @GetUser() user: User,
  ) {
    const payload = await this.paymentService.addPaymentWithThirdParty(
      studentId,
      dto,
      user,
    );
    return new GenericResponse("Payment initiated", payload);
  }

  @Patch(":id")
  @Auth(ERole.SCHOOL)
  @OkResponse()
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
    @GetUser() user: User,
  ) {
    const payload = await this.studentService.update(id, dto, user);
    return new GenericResponse("Student updated", payload);
  }

  @Delete(":id")
  @Auth(ERole.SCHOOL)
  @OkResponse()
  async remove(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.studentService.remove(id, user);
    return new GenericResponse("Student deleted", payload);
  }

  @Post("promotions")
  @Auth(ERole.SCHOOL)
  @CreatedResponse()
  async createPromotion(
    @Body() dto: CreatePromotionDto,
    @GetUser() user: User,
  ) {
    const payload = await this.studentService.createPromotions(dto, user);
    return new GenericResponse("Promotions created", payload);
  }

  @Post(":id/extra-fees")
  @Auth(ERole.SCHOOL)
  @CreatedResponse()
  async createExtraFee(
    @Param("id") id: string,
    dto: CreateExtraFeeDto,
    @GetUser() user: User,
  ) {
    const payload = await this.studentService.createExtraFee(id, dto, user);
    return new GenericResponse("Extra fee created", payload);
  }

  @Delete(":studentId/extra-fees/:extraFeeId")
  @Auth(ERole.SCHOOL)
  @OkResponse()
  async deleteExtraFee(
    @Param("studentId") studentId: string,
    @Param("extraFeeId") extraFeeId: string,
    @GetUser() user: User,
  ) {
    const payload = await this.studentService.deleteExtraFee(
      studentId,
      extraFeeId,
      user,
    );
    return new GenericResponse("Extra fee deleted", payload);
  }

  @Get("search/student")
  @Auth(ERole.SCHOOL, ERole.PARENT, ERole.RELATIVE)
  @OkResponse()
  async SearchStudent(@Param("studentId") studentId: string) {
    const payload = await this.studentService.searchStudent(studentId);
    return new GenericResponse("Student retrieved", payload);
  }
}
