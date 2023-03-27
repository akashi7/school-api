import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import Stripe from "stripe";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { IAppConfig } from "../__shared__/interfaces/app-config.interface";
import { stripeConstants } from "./config/stripe";
import { PaymentService } from "./payment.service";

@Controller("payments")
@ApiTags("Payments")
export class PaymentController {
  constructor(
    @Inject(stripeConstants.STRIPE_CLIENT) private readonly stripe: Stripe,
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
    const endpointSecret = this.configService.get("stripe").webhookSecret;
    const sig = req.headers["stripe-signature"];
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        endpointSecret,
      );
      await this.paymentService.handleStripeWebhookEvent(event);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
    return;
  }

  @Post("mpesa/callback")
  @HttpCode(HttpStatus.OK)
  async mpesaCallbackHandler(@Req() req: Request) {
    await this.paymentService.handleMpesaCallback(req.body);
    return;
  }
}
