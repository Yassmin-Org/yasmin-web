export interface ActivityItem {
  id: string;
  type: "TRANSACTION" | "PAYMENT_REQUEST" | "PAYLINK";
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  toUsername: string;
  value: number;
  notes?: string;
  isFulfilled?: boolean;
  isCancelled?: boolean;
  expiration?: string;
  code?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRequest {
  page?: number;
  limit?: number;
}

export interface ActivityResponse {
  data: {
    activities: ActivityItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  success: boolean;
}

export interface SingleActivityResponse {
  data: ActivityItem;
  success: boolean;
}
