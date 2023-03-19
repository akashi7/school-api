import { DynamicModule, Module } from "@nestjs/common";
import { Stripe } from "stripe";
import { stripeConstants } from "./config/stripe";

@Module({})
export class StripeModule {
  static forRoot(apiKey: string, config: Stripe.StripeConfig): DynamicModule {
    const stripe = new Stripe(apiKey, config);
    const stripeProvider = {
      provide: stripeConstants.STRIPE_CLIENT,
      useValue: stripe,
    };
    return {
      module: StripeModule,
      providers: [stripeProvider],
      exports: [stripeProvider],
      global: true,
    };
  }
}
