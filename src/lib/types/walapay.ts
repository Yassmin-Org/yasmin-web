export interface WalapayAccountRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
}

export interface WalapayAccountResponse {
  data: {
    accountId: string;
    status: string;
  };
  success: boolean;
}

export interface WalapayDepositRequest {
  amount: number;
  currency: string;
  country: string;
  rail: string;
  note?: string;
}

export interface WalapayDepositResponse {
  data: {
    depositId: string;
    fundingInstructions: {
      depositMessage?: string;
      amount?: string;
      bankName?: string;
      iban?: string;
      bic?: string;
      accountHolder?: string;
      accountNumber?: string;
      routingNumber?: string;
    };
  };
  success: boolean;
}

export interface WalapayOptionsResponse {
  data: {
    countries: Array<{
      code: string;
      name: string;
      currencies: string[];
      rails: string[];
    }>;
  };
  success: boolean;
}

export interface WalapayAccountStatusResponse {
  data: {
    accountId: string;
    status: "PENDING" | "ACTIVE" | "REJECTED";
    kycStatus?: string;
  };
  success: boolean;
}
