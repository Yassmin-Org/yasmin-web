export interface GetKYCResponse {
  data: {
    customerId?: string;
    walletId?: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "SUBMITTED";
    submissionIssues?: Array<{
      developerReason: string;
      reason: string;
    }>;
    provider: "bridge";
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
    session_id: string;
    url: string;
  };
}
