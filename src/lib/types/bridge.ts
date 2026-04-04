export interface CreateLocalAccountRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface BridgeKycLinkRequest {
  customerId: string;
}

export interface BridgeKycLinkResponse {
  data: {
    kycLink: string;
    kycStatus: string;
    tosStatus: string;
  };
  success: boolean;
}

export interface BridgeTransferRequest {
  amount: number;
  currency: string;
  rail: string;
  customerId: string;
}

export interface BridgeTransferResponse {
  data: {
    transferId: string;
    fundingInstructions: Record<string, string>;
  };
  success: boolean;
}

export interface TosLinksResponse {
  data: {
    tosLink: string;
  };
  success: boolean;
}
