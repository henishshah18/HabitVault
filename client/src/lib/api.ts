const API_BASE_URL = '';

export interface ApiResponse<T = any> {
  message?: string;
  status?: string;
  data?: T;
  error?: string;
}

export interface HelloResponse {
  message: string;
  status: string;
  backend: string;
  database: string;
  timestamp: string;
}

export interface StatusResponse {
  backend: {
    framework: string;
    status: string;
    port: number;
    cors: string;
  };
  database: {
    type: string;
    orm: string;
    status: string;
  };
  api: {
    version: string;
    endpoints: string[];
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface UsersResponse {
  users: User[];
  count: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async getHello(): Promise<HelloResponse> {
    return this.request<HelloResponse>('/api/hello');
  }

  async getStatus(): Promise<StatusResponse> {
    return this.request<StatusResponse>('/api/status');
  }

  async getUsers(): Promise<UsersResponse> {
    return this.request<UsersResponse>('/api/users');
  }

  async createUser(userData: { username: string; email: string }): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
}

export const apiClient = new ApiClient();
