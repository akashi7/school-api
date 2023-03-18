import { Inject, Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { stripeConstants } from "./config/stripe";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentService {
  constructor(
    @Inject(stripeConstants.STRIPE_CLIENT) private readonly stripe: Stripe,
  ) {}

  async createStripePayment(createPaymentDto: CreatePaymentDto) {
    return await this.createStripePaymentIntent(createPaymentDto);
  }

  async createStripePaymentIntent(createPaymentDto: CreatePaymentDto) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: createPaymentDto.amount,
      currency: createPaymentDto.currency,
      description: createPaymentDto.description,
      automatic_payment_methods: {
        enabled: true,
      },
      //   payment_method: "card",
    });
    return paymentIntent.client_secret;
  }
}
