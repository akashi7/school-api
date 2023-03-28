import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  Injectable,
  Logger,
  RawBodyRequest,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EPaymentMethod } from "@prisma/client";
import { Request } from "express";
import { lastValueFrom } from "rxjs";
import Stripe from "stripe";
import { PayFeeWithThirdPartyDto } from "../fee/dto/pay-fee.dto";
import { PrismaService } from "../prisma.service";
import { IAppConfig } from "../__shared__/interfaces/app-config.interface";
import { EPaymentStatus } from "./enums";
import {
  IMpesaAuthResponse,
  IMpesaCreatedPaymentResponse,
  IMpesaStatusResponse,
} from "./interfaces/mpesa.interface";

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<IAppConfig>,
  ) {
    this.stripe = new Stripe(this.configService.get("stripe").secretKey, {
      apiVersion: "2022-11-15",
    });
  }

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
  async handleStripeWebhookEvent(req: RawBodyRequest<Request>) {
    const endpointSecret = this.configService.get("stripe").webhookSecret;
    const sig = req.headers["stripe-signature"];
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        endpointSecret,
      );
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
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  async createMpesaPayment(amount: number, phoneNumber: string) {
    // Set up the request body
    const requestBody = {
      BusinessShortCode: this.configService.get("mpesa").shortCode,
      Password: Buffer.from(
        `${this.configService.get("mpesa").shortCode}${
          this.configService.get("mpesa").passKey
        }${this.getTimestamp()}`,
      ).toString("base64"),
      Timestamp: this.getTimestamp(),
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: this.configService.get("mpesa").shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: this.configService.get("mpesa").callbackUrl,
      AccountReference: "Test Payment",
      TransactionDesc: "Testing M-PESA API integration with NestJS",
    };

    const token = await this.mpesaGenerateToken();
    // Send the request to the API
    const response = await lastValueFrom(
      this.httpService.post<IMpesaCreatedPaymentResponse>(
        `${
          this.configService.get("mpesa").url
        }/mpesa/stkpush/v1/processrequest`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      ),
    );

    return response.data;
  }

  async handleMpesaCallback(requestBody: any) {
    // Set up the request body
    const { CheckoutRequestID } = requestBody.Body.stkCallback;
    const body = {
      BusinessShortCode: this.configService.get("mpesa").shortCode,
      Password: Buffer.from(
        `${this.configService.get("mpesa").shortCode}${
          this.configService.get("mpesa").passKey
        }${this.getTimestamp()}`,
      ).toString("base64"),
      Timestamp: this.getTimestamp(),
      CheckoutRequestID,
    };
    const token = await this.mpesaGenerateToken();
    // Send the request to the API to confirm the transaction
    const response = await lastValueFrom(
      this.httpService.post<IMpesaStatusResponse>(
        `${this.configService.get("mpesa").url}/mpesa/stkpushquery/v1/query`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      ),
    );
    if (response.data.ResponseCode === "0") {
      await this.prismaService.payment.updateMany({
        where: {
          referenceCode: response.data.CheckoutRequestID,
        },
        data: {
          status: EPaymentStatus.SUCCESS,
        },
      });
    }
  }

  getTimestamp() {
    return new Date().toISOString().split(".")[0].replace(/[T:-]/g, "");
  }

  async mpesaGenerateToken() {
    const auth = (
      await lastValueFrom(
        this.httpService.get<IMpesaAuthResponse>(
          `${
            this.configService.get("mpesa").url
          }/oauth/v1/generate?grant_type=client_credentials`,
          {
            auth: {
              username: this.configService.get("mpesa").consumerKey,
              password: this.configService.get("mpesa").consumerSecret,
            },
          },
        ),
      )
    ).data;
    return auth.access_token;
  }
}
