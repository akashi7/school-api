export interface IMpesaCreatedPaymentResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface IMpesaAuthResponse {
  access_token: string;
  expires_in: string;
}

export interface IMpesaStatusResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export interface SpennAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  clientId: string;
  audience: string;
  type: string;
  ".issued": string;
  ".expires": string;
}
export interface SpennStatusResponse {
  $id: string;
  requestId: string;
  status: string;
  externalReference: string;
}

export interface SpennCallbackUrlBody {
  RequestGuid: string;
  ExternalReference: string;
  RequestStatus: number;
}

export interface SpennPaymentRequest {
  phoneNumber: string;
  amount: number;
  message: string;
  callbackUrl: string;
  externalReference: string;
}

export interface SpennResultObject {
  $id: string;
  requestGuid: string;
  requestStatus: string;
  timestampCreated: string;
  phoneNumber: string;
  message: string;
  amount: number;
  externalReference: string;
  transactionStatus: string;
}

export interface MtnTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MtnStatusResponse {
  amount: number;
  currency: string;
  financialTransactionId: number;
  externalId: number;
  payer: {
    partyIdType: string;
    partyId: number;
  };
  status: string;
}
