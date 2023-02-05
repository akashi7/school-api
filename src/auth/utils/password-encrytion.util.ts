import * as bcrypt from "bcryptjs";

export class PasswordEncryption {
  /**
   * Hash password
   * @param password Password to hash
   * @returns password hash
   */
  hashPassword(password: any) {
    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);
    return hashedPassword;
  }
  /**
   * Compare password with hash
   * @param password Password to compare
   * @param hash Password hash
   * @returns boolean result
   */
  comparePassword(password: string, hash: string) {
    const result = bcrypt.compareSync(password, hash);
    return result;
  }
}
