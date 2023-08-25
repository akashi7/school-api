import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  async sendMail(to: string, subject: string, from: string, text: string) {
    try {
      await this.mailerService.sendMail({
        to,
        from,
        subject,
        text,
      });
    } catch (error) {
      console.log({ error });
    }
  }
}
