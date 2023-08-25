import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  RawBodyRequest,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EPaymentMethod, ERole, Payment, Prisma, User } from "@prisma/client";
import { Buffer } from "buffer";
import { endOfDay, startOfDay } from "date-fns";
import { Request } from "express";
import { catchError, lastValueFrom } from "rxjs";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { paginate } from "src/__shared__/utils/pagination.util";
import { MailService } from "src/mail/mail.service";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import { IAppConfig } from "../__shared__/interfaces/app-config.interface";
import {
  FindAllPaymentsDto,
  FindPaymentsByStudentDto,
} from "../fee/dto/find-fees.dto";
import { PayFeeDto, PayFeeWithThirdPartyDto } from "../fee/dto/pay-fee.dto";
import { PrismaService } from "../prisma.service";
import { EPaymentStatus } from "./enums";
import {
  IMpesaAuthResponse,
  IMpesaCreatedPaymentResponse,
  IMpesaStatusResponse,
  MtnStatusResponse,
  MtnTokenResponse,
  SpennAuthResponse,
  SpennCallbackUrlBody,
  SpennStatusResponse,
} from "./interfaces/mpesa.interface";

const https = require("https");

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<IAppConfig>,
    private readonly mailService: MailService,
  ) {
    this.stripe = new Stripe(this.configService.get("stripe").secretKey, {
      apiVersion: "2022-11-15",
    });
  }

  ReturnAgent() {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    return agent;
  }

  async sendMail(email: string, content: string) {
    try {
      await this.mailService.sendMail(
        email,
        "Payment status",
        "no-reply@schoolnestpay.com",
        content,
      );
    } catch (error) {
      console.error(error);
    }
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
      const payments = await this.prismaService.payment.findFirst({
        where: {
          id: payment.id,
        },
        include: {
          student: true,
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

          await this.sendMail(
            payments.student.email,
            `Your payment For ${payments.student.fullName} for academic term ${payment.academicTerm} is succesfull `,
          );

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
          await this.sendMail(
            payments.student.email,
            `Your payment For ${payments.student.fullName} for academic term ${payment.academicTerm} has failed `,
          );
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
      this.httpService
        .post<IMpesaCreatedPaymentResponse>(
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
        )
        .pipe(
          catchError((err) => {
            throw new BadRequestException(err.response.data);
          }),
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

  async spennGenerateToken(agent: any) {
    const body = {
      grant_type: "api_key",
      api_key: this.configService.get("spenn").apiKey,
      client_id: "SpennBusinessApiKey",
      audience: "SpennBusiness",
      client_secret: 1234,
    };
    const auth = (
      await lastValueFrom(
        this.httpService.post<SpennAuthResponse>(
          `${this.configService.get("spenn").tokenurl}`,
          body,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            httpsAgent: agent,
          },
        ),
      )
    ).data;
    return auth.access_token;
  }

  async createSpennPayment(phoneNumber: string, amount: number) {
    const agent = this.ReturnAgent();
    const token = await this.spennGenerateToken(agent);
    const body = {
      phoneNumber,
      amount,
      message: "Please send some money",
      callbackUrl: this.configService.get("spenn").callbackUrl,
      externalReference: uuidv4(),
    };
    const response = await lastValueFrom(
      this.httpService
        .post<SpennStatusResponse>(
          `${this.configService.get("spenn").url}/transaction/request`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            httpsAgent: agent,
          },
        )
        .pipe(
          catchError((err) => {
            throw new BadRequestException(err.response.data);
          }),
        ),
    );
    return response.data;
  }

  async handleSpennCallbackUrl(body: SpennCallbackUrlBody) {
    const payment = await this.prismaService.payment.findFirst({
      where: {
        referenceCode: body.ExternalReference,
      },
      include: {
        student: true,
      },
    });

    switch (body.RequestStatus) {
      case 2:
        await this.prismaService.payment.updateMany({
          where: {
            referenceCode: body.ExternalReference,
          },
          data: {
            status: EPaymentStatus.SUCCESS,
          },
        });
        await this.sendMail(
          payment.student.email,
          `Your payment For ${payment.student.fullName} for academic term ${payment.academicTerm} is sucessfull`,
        );
        break;
      case 3:
        await this.prismaService.payment.updateMany({
          where: {
            referenceCode: body.ExternalReference,
          },
          data: {
            status: EPaymentStatus.FAILED,
          },
        });
        await this.sendMail(
          payment.student.email,
          `Your payment For ${payment.student.fullName} for academic term ${payment.academicTerm} has failed `,
        );
        break;
      case 4:
        await this.prismaService.payment.updateMany({
          where: {
            referenceCode: body.ExternalReference,
          },
          data: {
            status: EPaymentStatus.FAILED,
          },
        });
        await this.sendMail(
          payment.student.email,
          `Your payment For ${payment.student.fullName} for academic term ${payment.academicTerm} has failed `,
        );
        break;
      default:
        break;
    }
  }

  async generateMtnMomoToken() {
    const keys = `${this.configService.get("mtn").apiUser}:${
      this.configService.get("mtn").apiKey
    }`;
    const basicEncode = Buffer.from(keys).toString("base64");
    const response = await lastValueFrom(
      this.httpService
        .post<MtnTokenResponse>(
          `${this.configService.get("mtn").url}/collection/token/`,
          "",
          {
            headers: {
              Authorization: `Basic ${basicEncode}`,
              "Ocp-Apim-Subscription-Key": `${
                this.configService.get("mtn").subscriptionKey
              }`,
            },
          },
        )
        .pipe(
          catchError((err) => {
            throw new BadRequestException(err.response.data);
          }),
        ),
    );
    return response.data;
  }

  async createMtnMomopayment(amount: number, phoneNumber: string) {
    const token = (await this.generateMtnMomoToken()).access_token;
    const externalId = uuidv4();
    const body = {
      amount: amount.toString(),
      currency: "RWF",
      externalId: externalId,
      payer: {
        partyIdType: "MSISDN",
        partyId: phoneNumber,
      },
      payerMessage: "Pay me",
      payeeNote: "waiting",
    };

    const referenceId = uuidv4();
    const response = await lastValueFrom(
      this.httpService
        .post<any>(
          `${this.configService.get("mtn").url}/collection/v1_0/requesttopay`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "Ocp-Apim-Subscription-Key": `${
                this.configService.get("mtn").subscriptionKey
              }`,
              "X-Reference-Id": `${referenceId}`,
              "X-Target-Environment": "mtnrwanda",
            },
          },
        )
        .pipe(
          catchError((err) => {
            throw new BadRequestException(err.response.data);
          }),
        ),
    );
    return { response: response.data, referenceId };
  }

  async checkMtnPaymentStatus(referenceId: string) {
    const token = (await this.generateMtnMomoToken()).access_token;
    const checkStatus = async (): Promise<string> => {
      const response = await lastValueFrom(
        this.httpService
          .get<MtnStatusResponse>(
            `${
              this.configService.get("mtn").url
            }/collection/v1_0/requesttopay/${referenceId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Ocp-Apim-Subscription-Key": `${
                  this.configService.get("mtn").subscriptionKey
                }`,
                "X-Target-Environment": "mtnrwanda",
              },
            },
          )
          .pipe(
            catchError((err) => {
              throw new BadRequestException(err.response.data);
            }),
          ),
      );
      return response.data.status;
    };

    const payment = await this.prismaService.payment.findFirst({
      where: {
        referenceCode: referenceId,
      },
      include: {
        student: true,
      },
    });

    let status: string = await checkStatus();
    let shouldRespond = false;
    while (!(status === "SUCCESS" || status === "FAILED")) {
      status = await checkStatus();
      shouldRespond = true;
    }

    switch (status) {
      case "SUCCESS":
        await this.prismaService.payment.updateMany({
          where: {
            referenceCode: referenceId,
          },
          data: {
            status: EPaymentStatus.SUCCESS,
          },
        });
        await this.sendMail(
          payment.student.email,
          `Your payment For ${payment.student.fullName} for academic term ${payment.academicTerm} is successfully `,
        );
        break;
      case "FAILED":
        await this.prismaService.payment.updateMany({
          where: {
            referenceCode: referenceId,
          },
          data: {
            status: EPaymentStatus.FAILED,
          },
        });
        await this.sendMail(
          payment.student.email,
          `Your payment For ${payment.student.fullName} for academic term ${payment.academicTerm} has failed `,
        );
        break;
      default:
        break;
    }
    if (shouldRespond) {
      return status;
    }
  }

  async addFeePayment(
    studentId: string,
    feeId: string,
    dto: PayFeeDto,
    user: User,
  ) {
    const student =
      user.role === ERole.SCHOOL
        ? await this.prismaService.user.findFirst({
            where: {
              id: studentId,
              role: ERole.STUDENT,
              schoolId: user.schoolId,
            },
          })
        : user.role === ERole.PARENT
        ? await this.prismaService.user.findFirst({
            where: { id: studentId, parentId: user.id, role: ERole.STUDENT },
          })
        : await this.prismaService.user.findFirst({
            where: { id: user.id, role: ERole.STUDENT },
          });

    if (!student) throw new NotFoundException("Student not found");
    const fee = await this.prismaService.fee.findFirst({
      where: { id: feeId, schoolId: user.schoolId },
    });
    if (!fee) throw new NotFoundException("Fee not found");
    const academicYear = await this.prismaService.academicYear.findFirst({
      where: { id: dto.academicYearId },
    });
    if (!academicYear) throw new NotFoundException("Academic year not found");
    const transaction = await this.prismaService.payment.create({
      data: {
        amount: dto.amount,
        feeId,
        studentId,
        schoolId: user.schoolId,
        paymentMethod: dto.paymentMethod,
        referenceCode: dto.referenceCode,
        date: dto.date,
        description: dto.description,
        phoneNumber: dto.phoneNumber,
        academicYearId: dto.academicYearId,
        academicTerm: dto.academicTerm,
      },
    });
    return transaction;
  }

  async addPayment(studentId: string, dto: PayFeeDto, user: User) {
    const student =
      user.role === ERole.SCHOOL
        ? await this.prismaService.user.findFirst({
            where: {
              id: studentId,
              role: ERole.STUDENT,
              schoolId: user.schoolId,
            },
          })
        : user.role === ERole.PARENT
        ? await this.prismaService.user.findFirst({
            where: { id: studentId, parentId: user.id, role: ERole.STUDENT },
          })
        : await this.prismaService.user.findFirst({
            where: { id: user.id, role: ERole.STUDENT },
          });

    if (!student) throw new NotFoundException("Student not found");
    const academicYear = await this.prismaService.academicYear.findFirst({
      where: { id: dto.academicYearId },
    });
    if (!academicYear) throw new NotFoundException("Academic year not found");
    const transaction = await this.prismaService.payment.create({
      data: {
        amount: dto.amount,
        studentId,
        schoolId: user.schoolId,
        paymentMethod: dto.paymentMethod,
        referenceCode: dto.referenceCode,
        date: dto.date,
        description: dto.description,
        phoneNumber: dto.phoneNumber,
        academicYearId: dto.academicYearId,
        academicTerm: dto.academicTerm,
      },
    });
    return transaction;
  }

  async payFeeWithThirdParty(
    studentId: string,
    feeId: string,
    dto: PayFeeWithThirdPartyDto,
    user: User,
  ) {
    const student =
      user.role === ERole.SCHOOL
        ? await this.prismaService.user.findFirst({
            where: {
              id: studentId,
              role: ERole.STUDENT,
              schoolId: user.schoolId,
            },
          })
        : user.role === ERole.PARENT
        ? await this.prismaService.user.findFirst({
            where: { id: studentId, parentId: user.id, role: ERole.STUDENT },
          })
        : user.role === ERole.RELATIVE
        ? await this.prismaService.user.findFirst({
            where: { id: studentId, relativeId: user.id, role: ERole.STUDENT },
          })
        : await this.prismaService.user.findFirst({
            where: { id: user.id, role: ERole.STUDENT },
          });

    if (!student) throw new NotFoundException("Student not found");
    const fee = await this.prismaService.fee.findFirst({
      where: {
        id: feeId,
        schoolId: !user.schoolId ? student.schoolId : user.schoolId,
      },
    });
    if (!fee) throw new NotFoundException("Fee not found");
    const academicYear = await this.prismaService.academicYear.findFirst({
      where: { id: dto.academicYearId },
    });
    if (!academicYear) throw new NotFoundException("Academic year not found");
    const newPayment = await this.prismaService.payment.create({
      data: {
        amount: dto.amount,
        feeId,
        studentId,
        schoolId: user.schoolId,
        paymentMethod: dto.paymentMethod,
        description: dto.description,
        phoneNumber: dto.phoneNumber.replace("+", ""),
        academicYearId: dto.academicYearId,
        academicTerm: dto.academicTerm,
        date: new Date(),
      },
    });
    switch (dto.paymentMethod) {
      case EPaymentMethod.STRIPE:
        const stripeResult = await this.createStripePaymentIntent(dto);
        await this.prismaService.payment.update({
          where: { id: newPayment.id },
          data: { referenceCode: stripeResult.id },
        });
        return stripeResult.client_secret;
      case EPaymentMethod.MPESA:
        dto.phoneNumber = dto.phoneNumber.replace("+", "");
        const mpesaResult = await this.createMpesaPayment(
          dto.amount,
          dto.phoneNumber,
        );
        await this.prismaService.payment.update({
          where: { id: newPayment.id },
          data: { referenceCode: mpesaResult.CheckoutRequestID },
        });
        return mpesaResult.ResponseDescription;
      case EPaymentMethod.SPENN:
        const spennResult = await this.createSpennPayment(
          dto.phoneNumber,
          dto.amount,
        );
        await this.prismaService.payment.update({
          where: { id: newPayment.id },
          data: { referenceCode: spennResult.externalReference },
        });
        return spennResult;
      case EPaymentMethod.MTN:
        dto.phoneNumber = dto.phoneNumber.replace("+", "");
        const mtnResult = await this.createMtnMomopayment(
          dto.amount,
          dto.phoneNumber,
        );
        this.checkMtnPaymentStatus(mtnResult.referenceId);
        await this.prismaService.payment.update({
          where: { id: newPayment.id },
          data: { referenceCode: mtnResult.referenceId },
        });
        return mtnResult.response;
    }
  }

  async addPaymentWithThirdParty(
    studentId: string,
    dto: PayFeeWithThirdPartyDto,
    user: User,
  ) {
    const student =
      user.role === ERole.SCHOOL
        ? await this.prismaService.user.findFirst({
            where: {
              id: studentId,
              role: ERole.STUDENT,
              schoolId: user.schoolId,
            },
          })
        : user.role === ERole.PARENT
        ? await this.prismaService.user.findFirst({
            where: { id: studentId, parentId: user.id, role: ERole.STUDENT },
          })
        : user.role === ERole.RELATIVE
        ? await this.prismaService.user.findFirst({
            where: { id: studentId, relativeId: user.id, role: ERole.STUDENT },
          })
        : await this.prismaService.user.findFirst({
            where: { id: user.id, role: ERole.STUDENT },
          });

    if (!student) throw new NotFoundException("Student not found");
    const academicYear = await this.prismaService.academicYear.findFirst({
      where: { id: dto.academicYearId },
    });
    if (!academicYear) throw new NotFoundException("Academic year not found");
    const newPayment = await this.prismaService.payment.create({
      data: {
        amount: dto.amount,
        studentId: studentId,
        schoolId: user.schoolId,
        paymentMethod: dto.paymentMethod,
        description: dto.description,
        phoneNumber: dto.phoneNumber.replace("+", ""),
        academicYearId: dto.academicYearId,
        academicTerm: dto.academicTerm,
        date: new Date(),
      },
    });
    switch (dto.paymentMethod) {
      case EPaymentMethod.STRIPE:
        const stripeResult = await this.createStripePaymentIntent(dto);
        await this.prismaService.payment.update({
          where: { id: newPayment.id },
          data: { referenceCode: stripeResult.id },
        });
        return stripeResult.client_secret;
      case EPaymentMethod.MPESA:
        dto.phoneNumber = dto.phoneNumber.replace("+", "");
        const mpesaResult = await this.createMpesaPayment(
          dto.amount,
          dto.phoneNumber,
        );
        await this.prismaService.payment.update({
          where: { id: newPayment.id },
          data: { referenceCode: mpesaResult.CheckoutRequestID },
        });
        return mpesaResult.ResponseDescription;
      case EPaymentMethod.SPENN:
        const spennResult = await this.createSpennPayment(
          dto.phoneNumber,
          dto.amount,
        );
        await this.prismaService.payment.update({
          where: { id: newPayment.id },
          data: { referenceCode: spennResult.externalReference },
        });
        return spennResult;
      case EPaymentMethod.MTN:
        dto.phoneNumber = dto.phoneNumber.replace("+", "");
        const mtnResult = await this.createMtnMomopayment(
          dto.amount,
          dto.phoneNumber,
        );
        this.checkMtnPaymentStatus(mtnResult.referenceId);
        await this.prismaService.payment.update({
          where: { id: newPayment.id },
          data: { referenceCode: mtnResult.referenceId },
        });
        return mtnResult.response;
    }
  }

  async findPaymentsByStudent(
    id: string,
    dto: FindPaymentsByStudentDto,
    user: User,
    { page, size }: IPagination,
  ) {
    let result: any;

    const whereClause: Prisma.PaymentWhereInput = {};

    if (dto.from && dto.to) {
      const start = new Date(dto.from);
      const end = new Date(dto.to);
      whereClause.AND = [
        { createdAt: { gte: startOfDay(start) } },
        { createdAt: { lte: endOfDay(end) } },
      ];
    }

    let children: User;

    if (user.role === ERole.PARENT) {
      children = await this.prismaService.user.findFirst({
        where: {
          role: ERole.STUDENT,
          parentId: user.id,
        },
      });
    }
    if (user.role === ERole.RELATIVE) {
      children = await this.prismaService.user.findFirst({
        where: {
          role: ERole.STUDENT,
          relativeId: user.id,
        },
      });
    }

    const school = await this.prismaService.user.findFirst({
      where: {
        role: ERole.SCHOOL,
        schoolId: children.schoolId,
      },
      include: {
        school: true,
      },
    });

    if (user.role === ERole.ADMIN) {
      result = await paginate<Payment, Prisma.PaymentFindManyArgs>(
        this.prismaService.payment,
        {
          where: {
            academicYearId: dto.academicYearId,
            academicTerm: dto.academicTerm,
          },
          include: {
            fee: true,
            academicYear: true,
            student: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        +page,
        +size,
      );
    } else {
      result = await paginate<Payment, Prisma.PaymentFindManyArgs>(
        this.prismaService.payment,
        {
          where: {
            student:
              user.role === ERole.SCHOOL
                ? { id, schoolId: user.schoolId }
                : user.role === ERole.STUDENT
                ? { id: user.id }
                : user.role === ERole.RELATIVE
                ? {
                    id,
                    relativeId: user.id,
                  }
                : { id, parentId: user.id },
            academicYearId: dto.academicYearId,
            academicTerm: dto.academicTerm,
            ...whereClause,
          },
          include: {
            fee: true,
            academicYear: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        +page,
        +size,
      );
    }
    if (user.role === ERole.ADMIN) {
      return result;
    }
    return { result, school };
  }
  async findAllPaymentsMade(
    dto: FindAllPaymentsDto,
    user: User,
    { page, size }: IPagination,
  ) {
    const whereClause: Prisma.PaymentWhereInput = {};

    if (dto.academicYearId) {
      whereClause.academicYearId = dto.academicYearId;
    }

    if (dto.academicTerm) {
      whereClause.academicTerm = dto.academicTerm;
    }

    if (user.role !== ERole.ADMIN) {
      whereClause.schoolId = user.schoolId;
    }

    if (dto.studentIdentifier) {
      whereClause.student = {
        OR: [
          { studentIdentifier: dto.studentIdentifier },
          {
            fullName: { contains: dto.studentIdentifier, mode: "insensitive" },
          },
        ],
      };
    }

    if (dto.from && dto.to) {
      const start = new Date(dto.from);
      const end = new Date(dto.to);
      whereClause.AND = [
        { createdAt: { gte: startOfDay(start) } },
        { createdAt: { lte: endOfDay(end) } },
      ];
    }

    const result = await paginate<Payment, Prisma.PaymentFindManyArgs>(
      this.prismaService.payment,
      {
        where: whereClause,
        include: {
          fee: true,
          academicYear: true,
          student: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      +page,
      +size,
    );

    return result;
  }
}
