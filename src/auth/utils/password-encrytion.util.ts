import * as bcrypt from "bcryptjs";

export class PasswordEncryption {
  hashPassword(pass: any) {
    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(pass, salt);
    return hashedPassword;
  }

  comparePassword(pass: string, hash: string) {
    const result = bcrypt.compareSync(pass, hash);
    return result;
  }
}
