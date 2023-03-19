import { Inject, Injectable, Logger } from "@nestjs/common";
import { EPaymentMethod } from "@prisma/client";
import Stripe from "stripe";
import { PayFeeWithThirdPartyDto } from "../fee/dto/pay-fee.dto";
import { PrismaService } from "../prisma.service";
import { stripeConstants } from "./config/stripe";
import { EPaymentStatus } from "./enums";

@Injectable()
export class PaymentService {
  constructor(
    @Inject(stripeConstants.STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly prismaService: PrismaService,
  ) {}

  async createStripePaymentIntent(
    createPaymentDto: PayFeeWithThirdPartyDto,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: createPaymentDto.amount,
      currency: createPaymentDto.currency,
      description: createPaymentDto.description,
      automatic_payment_methods: {
        enabled: true,
      },
      //   payment_method: "card",
    });
    return paymentIntent;
  }
  async handleWebhookEvent(event: Stripe.Event) {
    const payment = await this.prismaService.payment.findFirst({
      where: {
        referenceCode: event.data.object["id"],
        paymentMethod: EPaymentMethod.STRIPE,
      },
    });
    if (!payment) return;
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntentSucceeded = event.data.object;
        Logger.log(paymentIntentSucceeded, "payment_intent.succeeded");
        await this.prismaService.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: EPaymentStatus.SUCCESS,
          },
        });
        break;
      case "payment_intent.payment_failed":
        await this.prismaService.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: EPaymentStatus.FAILED,
          },
        });
      case "payment_intent.canceled":
        await this.prismaService.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: EPaymentStatus.FAILED,
          },
        });

      default:
        break;
    }
  }
}
