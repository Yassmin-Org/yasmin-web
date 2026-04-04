export interface UserInfo {
  phoneNumber?: string;
  countryCode?: string;
  email?: string;
  country?: string;
  city?: string;
  citizenship: string[];
  legalResidence: string[];
}

export interface User {
  id: string;
  username: string;
  walletAddress: string;
  isAgent: boolean;
  info: UserInfo;
  balance: number;
  usdcBalance: number;
  points: number;
  walapayAccountId?: string;
  bridgeCustId?: string;
  provider: "bridge" | "walapay" | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  citizenship: string[];
  legalResidence: string[];
  locationStatus: "LOCAL" | "FOREIGN";
  country?: string;
  preferredLanguage?: string;
}

export interface GetUserResponse {
  data: User;
  success: boolean;
}

export interface UserAvailabilityRequest {
  username?: string;
  phoneNumber?: string;
  email?: string;
}

export interface UserAvailabilityResponse {
  data: { available: boolean };
  success: boolean;
}

export interface UserSearchRequest {
  query: string;
}

export interface UserSearchResponse {
  data: User[];
  success: boolean;
}

export interface UpdateCitizenshipRequest {
  citizenship: string[];
}

export interface UpdateLegalResidenceRequest {
  legalResidence: string[];
}

export interface UpdatePushTokenRequest {
  expoPushToken: string;
}

export interface UpdateLanguageRequest {
  preferredLanguage: string;
}
