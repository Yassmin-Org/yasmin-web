export enum PaymentRequestStatus {
  PENDING = "PENDING",
  FULFILLED = "FULFILLED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum PaymentRequestType {
  PAYMENT_REQUEST = "PAYMENT_REQUEST",
  PAYLINK = "PAYLINK",
  CASH_IN = "CASH_IN",
  CASH_OUT = "CASH_OUT",
}

export interface UsdcTransferRequest {
  destinationWalletAddress: string;
  amount: number;
  notes?: string;
}

export interface UsdcTransferResponse {
  data: {
    transactionHash: string;
    fromUserId: string;
    toUserId: string;
    value: number;
  };
  success: boolean;
}

export interface UsdcCashoutRequest {
  destinationWalletAddress: string;
  amount: number;
  notes?: string;
}

export interface UsdcCashoutResponse {
  data: {
    transactionHash: string;
    value: number;
    fee: number;
  };
  success: boolean;
}

export interface CreatePaymentRequestRequest {
  amount: number;
  type: PaymentRequestType;
  note?: string;
  receiverUserId?: string;
}

export interface PaymentRequest {
  id: string;
  code: string;
  receiverUserId: string;
  senderUserId?: string;
  amount: number;
  note?: string;
  type: PaymentRequestType;
  status: PaymentRequestStatus;
  isFulfilled: boolean;
  isCancelled: boolean;
  expiration: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequestResponse {
  data: PaymentRequest;
  success: boolean;
}

export interface FulfillPaymentRequestRequest {
  code: string;
}

export interface FulfillPaymentRequestResponse {
  data: {
    transactionHash: string;
    value: number;
  };
  success: boolean;
}

export interface GetPaymentRequestResponse {
  data: PaymentRequest;
  success: boolean;
}
