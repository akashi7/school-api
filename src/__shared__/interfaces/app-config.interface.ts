export interface IAppConfig {
  port?: number;
  databaseUrl: string;
  env?: any;
  jwt?: JwtConfig;
  allowedOrigins?: string[];
  swaggerEnabled?: boolean;
  stripe?: IStripeConfig;
  mpesa?: IMpesaConfig;
  spenn?: SpennConfig;
  mtn?: MtnConfig;
  sms?: SmsConfig;
}

interface JwtConfig {
  secret: string;
  expiresIn: string | number;
}

interface IStripeConfig {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
}

interface IMpesaConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  passKey: string;
  callbackUrl: string;
}

interface SpennConfig {
  url: string;
  apiKey: string;
  tokenurl: string;
  callbackUrl: string;
}

interface MtnConfig {
  url: string;
  apiKey: string;
  apiUser: string;
  subscriptionKey: string;
}
interface SmsConfig {
  url: string;
  username: string;
  password: string;
}
