import { MailerModule } from "@nestjs-modules/mailer";
import { Global, Module } from "@nestjs/common";
import { MailService } from "./mail.service";

@Global()
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: "smtp.hostinger.com",
        secure: true,
        auth: {
          user: "no-reply@schoolnestpay.com",
          pass: "SchoolNestPay#269",
        },
        defaults: {
          from: "no-reply@schoolnestpay.com",
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
