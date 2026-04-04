import { User } from "./user";

export interface AddStarRequest {
  starredUserId: string;
}

export interface RemoveStarRequest {
  starredUserId: string;
}

export interface GetStarsResponse {
  data: User[];
  success: boolean;
}
