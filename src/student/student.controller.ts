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
import { Auth } from "../auth/decorators/auth.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import {
  CreatedResponse,
  OkResponse,
  PageResponse,
  Paginated,
  PaginationParams,
} from "../__shared__/decorators";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { IPagination } from "../__shared__/interfaces/pagination.interface";
import { CreateExtraFeeDto } from "./dto/create-extra-fee.dto";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { CreateStudentDto } from "./dto/create-student.dto";
import { StudentSearchDto } from "./dto/student-search.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentService } from "./student.service";

@Controller("students")
@Auth(ERole.SCHOOL)
@ApiTags("Students")
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @CreatedResponse()
  async createStudent(@Body() dto: CreateStudentDto, @GetUser() user: User) {
    const payload = await this.studentService.create(dto, user);
    return new GenericResponse("Student created", payload);
  }
  @Get()
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
  @OkResponse()
  async getStudent(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.studentService.findOne(id, user);
    return new GenericResponse("Student retrieved", payload);
  }

  @Patch(":id")
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
  @OkResponse()
  async remove(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.studentService.remove(id, user);
    return new GenericResponse("Student deleted", payload);
  }
  @Post(":id/promotions")
  @CreatedResponse()
  async createPromotion(
    @Param("id") id: string,
    dto: CreatePromotionDto,
    @GetUser() user: User,
  ) {
    const payload = await this.studentService.createPromotion(id, dto, user);
    return new GenericResponse("Promotion created", payload);
  }
  @Patch(":studentId/promotions/:promotionId")
  @OkResponse()
  async updatePromotion(
    @Param("studentId") studentId: string,
    @Param("promotionId") promotionId: string,
    dto: UpdatePromotionDto,
    @GetUser() user: User,
  ) {
    const payload = await this.studentService.updatePromotion(
      studentId,
      promotionId,
      dto,
      user,
    );
    return new GenericResponse("Promotion updated", payload);
  }
  @Delete(":studentId/promotions/:promotionId")
  @OkResponse()
  async deletePromotion(
    @Param("studentId") studentId: string,
    @Param("promotionId") promotionId: string,
    @GetUser() user: User,
  ) {
    const payload = await this.studentService.deletePromotion(
      studentId,
      promotionId,
      user,
    );
    return new GenericResponse("Promotion deleted", payload);
  }

  @Post(":id/extra-fees")
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
}
