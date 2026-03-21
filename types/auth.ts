export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface RefreshResponse {
  token: string;
  refreshToken?: string;
}
