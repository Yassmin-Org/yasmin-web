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
  bridgeCustId?: string;
  provider: "bridge" | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  isAgent: boolean;
  email?: string;
  countryCode?: string;
  phoneNumber?: string;
  citizenship: string[];
  legalResidence: string[];
  preferredLanguage?: "en" | "ar";
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
  data: { identifier: string; isAvailable: boolean };
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
