export interface GetKYCResponse {
  data: {
    customerId?: string;
    walletId?: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "SUBMITTED";
    submissionIssues?: Array<{
      developerReason: string;
      reason: string;
    }>;
    provider: "walapay" | "bridge";
    isYasminVerified: boolean;
    isBridgeVerified: boolean;
  };
  success: boolean;
}

export interface CreateDiditSessionRequest {
  userId: string;
}

export interface CreateDiditSessionResponse {
  data: {
    sessionId: string;
    sessionUrl: string;
  };
  success: boolean;
}
