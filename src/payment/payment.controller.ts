import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import Stripe from "stripe";
import { Auth } from "../auth/decorators/auth.decorator";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { stripeConstants } from "./config/stripe";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentService } from "./payment.service";

@Controller("payments")
@ApiTags("Payments")
export class PaymentController {
  constructor(
    @Inject(stripeConstants.STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly paymentService: PaymentService,
  ) {}

  @Post("stripe")
  @Auth()
  async createStripePayment(@Body() dto: CreatePaymentDto) {
    const result = await this.paymentService.createStripePayment(dto);
    return new GenericResponse("Stripe payment intent", result);
  }
  @Get("stripe/key")
  @Auth()
  async getStripeKey() {
    return new GenericResponse("Stripe key", process.env.STRIPE_PUBLIC_KEY);
  }
  @Post("stripe/webhook")
  async stripeWebHook(@Req() req: RawBodyRequest<Request>, @Body() dto: any) {
    const endpointSecret =
      "whsec_671fbb5c6db12dc5cf1b08114ef476e3a29d96909f6f0c18865c49b72804aeea";
    const sig = req.headers["stripe-signature"];
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        endpointSecret,
      );
      Logger.log(event, "stripeWebHook");
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntentSucceeded = event.data.object;
        Logger.log(paymentIntentSucceeded, "payment_intent.succeeded");
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return;
  }
}
