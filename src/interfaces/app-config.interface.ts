export interface IAppConfig {
  port?: number;
  env?: any;
  jwt?: JwtConfig;
  allowedOrigins?: string[];
  swaggerEnabled?: boolean;
}

interface JwtConfig {
  secret: string;
  expiresIn: string | number;
}
