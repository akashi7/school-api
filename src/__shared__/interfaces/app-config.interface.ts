export interface IAppConfig {
  port?: number;
  databaseUrl: string;
  env?: any;
  jwt?: JwtConfig;
  allowedOrigins?: string[];
  swaggerEnabled?: boolean;
}

interface JwtConfig {
  secret: string;
  expiresIn: string | number;
}
