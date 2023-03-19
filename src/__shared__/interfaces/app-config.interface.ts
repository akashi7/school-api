export interface IAppConfig {
  port?: number;
  databaseUrl: string;
  env?: any;
  jwt?: JwtConfig;
  allowedOrigins?: string[];
  swaggerEnabled?: boolean;
  stripe?: IStripeConfig;
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
