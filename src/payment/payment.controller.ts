import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
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
}
