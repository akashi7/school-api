export interface IAppConfig {
  port?: number;
  databaseUrl: string;
  env?: any;
  jwt?: JwtConfig;
  allowedOrigins?: string[];
  swaggerEnabled?: boolean;
  stripe?: IStripeConfig;
  mpesa?: IMpesaConfig;
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
