import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
import { Request, Response } from "express";
import {
  PageResponse,
  Paginated,
  PaginationParams,
} from "src/__shared__/decorators";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import {
  FindAllPaymentsDto,
  FindPaymentsByStudentDto,
} from "src/fee/dto/find-fees.dto";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { IAppConfig } from "../__shared__/interfaces/app-config.interface";
import { SpennCallbackUrlBody } from "./interfaces/mpesa.interface";
import { PaymentService } from "./payment.service";

@Controller("payments")
@ApiTags("Payments")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService<IAppConfig>,
  ) {}

  @Get("stripe/key")
  async getStripeKey() {
    return new GenericResponse(
      "Stripe key",
      this.configService.get("stripe").publicKey,
    );
  }
  @Post("stripe/webhook")
  @HttpCode(HttpStatus.OK)
  async stripeWebHookHandler(@Req() req: RawBodyRequest<Request>) {
    await this.paymentService.handleStripeWebhookEvent(req);
    return;
  }

  @Post("mpesa/callback")
  @HttpCode(HttpStatus.OK)
  async mpesaCallbackHandler(@Req() req: Request) {
    await this.paymentService.handleMpesaCallback(req.body);
    return;
  }

  @Post("spenn/callback")
  @HttpCode(HttpStatus.OK)
  async spennCallbackHandler(@Body() body: SpennCallbackUrlBody) {
    await this.paymentService.handleSpennCallbackUrl(body);
    return;
  }

  @Get("spenn/callback")
  @HttpCode(HttpStatus.OK)
  async mtnCallbackHandler(@Param("id") referenceId: string) {
    await this.paymentService.checkMtnPaymentStatus(referenceId);
    return;
  }

  @Get()
  @Auth(ERole.ADMIN, ERole.SCHOOL)
  @Paginated()
  @PageResponse()
  async findPayments(
    @Query() dto: FindAllPaymentsDto,
    @GetUser() user: User,
    @PaginationParams() options: IPagination,
  ) {
    const payload = await this.paymentService.findAllPaymentsMade(
      dto,
      user,
      options,
    );
    return new GenericResponse("Student payments retrieved", payload);
  }

  @Get("/downloadExcel/:id")
  @Auth(ERole.ADMIN, ERole.SCHOOL)
  async downloadPayroll(
    @Param("id") id: string,
    @GetUser() user: User,
    @Res() res: Response,
    @Query() dto: FindPaymentsByStudentDto,
  ) {
    const { workbook, filename } =
      await this.paymentService.downloadPaymentsExcel(id, dto, user);
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${filename}.xlsx`,
    });
    workbook.xlsx.write(res).then(() => res.end());
  }
  @Post("mpessa")
  @HttpCode(HttpStatus.OK)
  async mpessaToken() {
    const payload = await this.paymentService.makeNewMpessapayment();
    return new GenericResponse("Payment generated", payload);
  }
}
