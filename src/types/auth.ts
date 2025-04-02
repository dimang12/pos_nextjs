export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
} 