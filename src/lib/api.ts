/**
 * API client configuration using Axios
 * Provides centralized HTTP client with authentication, interceptors, and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  User,
  Product,
  Category,
  UserCreate,
  UserLogin,
  UserUpdate,
  ProductCreate,
  ProductUpdate,
  CategoryCreate,
  CategoryUpdate,
  AuthResponse,
  ProductListResponse,
  CategoryListResponse,
  UserStats,
  CategoryStats,
  ProductQueryParams,
  CategoryProductsQueryParams,
  ProductWithDetails,
  CategoryWithProductCount,
  ApiError,
} from '@/types';

// ==================== Configuration ====================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== Token Management ====================

const TOKEN_KEY = 'marketplace_token';

export const tokenStorage = {
  get: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

// ==================== Interceptors ====================

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      tokenStorage.remove();
      // Redirect to login page or trigger auth state update
      window.location.href = '/login';
    }

    // Transform error response to consistent format
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      detail: error.response?.data?.detail,
      status_code: error.response?.status,
    };

    return Promise.reject(apiError);
  }
);

// ==================== Generic API Functions ====================

class ApiService {
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.request<T>(config);
    return response.data;
  }

  private async get<T>(url: string, params?: any): Promise<T> {
    return this.request<T>({ method: 'GET', url, params });
  }

  private async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'POST', url, data });
  }

  private async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  private async delete<T>(url: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', url });
  }

  // ==================== Authentication APIs ====================

  async login(credentials: UserLogin): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    return this.request<AuthResponse>({
      method: 'POST',
      url: '/auth/login',
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async register(userData: UserCreate): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/register', userData);
  }

  async getCurrentUser(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/refresh');
  }

  // ==================== User APIs ====================

  async getUsers(page: number = 1, perPage: number = 10): Promise<{ users: User[]; total: number }> {
    return this.get<{ users: User[]; total: number }>('/users/', {
      page,
      per_page: perPage,
    });
  }

  async getUser(userId: string): Promise<User> {
    return this.get<User>(`/users/${userId}`);
  }

  async updateUser(userId: string, userData: UserUpdate): Promise<User> {
    return this.put<User>(`/users/${userId}`, userData);
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/users/${userId}`);
  }

  async getUserStats(userId: string): Promise<UserStats> {
    return this.get<UserStats>(`/users/${userId}/stats`);
  }

  // ==================== Product APIs ====================

  async getProducts(params: ProductQueryParams = {}): Promise<ProductListResponse> {
    return this.get<ProductListResponse>('/products/', params);
  }

  async getProduct(productId: string): Promise<ProductWithDetails> {
    return this.get<ProductWithDetails>(`/products/${productId}`);
  }

  async createProduct(productData: ProductCreate): Promise<Product> {
    return this.post<Product>('/products/', productData);
  }

  async updateProduct(productId: string, productData: ProductUpdate): Promise<Product> {
    return this.put<Product>(`/products/${productId}`, productData);
  }

  async deleteProduct(productId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/products/${productId}`);
  }

  async getUserProducts(
    userId: string,
    params: ProductQueryParams = {}
  ): Promise<ProductListResponse> {
    return this.get<ProductListResponse>(`/products/user/${userId}`, params);
  }

  async searchProducts(query: string, params: ProductQueryParams = {}): Promise<ProductListResponse> {
    return this.get<ProductListResponse>('/products/search', {
      ...params,
      search: query,
    });
  }

  // ==================== Category APIs ====================

  async getCategories(): Promise<CategoryListResponse> {
    return this.get<CategoryListResponse>('/categories/');
  }

  async getCategoriesWithCount(): Promise<{ categories: CategoryWithProductCount[] }> {
    return this.get<{ categories: CategoryWithProductCount[] }>('/categories/with-count');
  }

  async getCategory(categoryId: string): Promise<Category> {
    return this.get<Category>(`/categories/${categoryId}`);
  }

  async createCategory(categoryData: CategoryCreate): Promise<Category> {
    return this.post<Category>('/categories/', categoryData);
  }

  async updateCategory(categoryId: string, categoryData: CategoryUpdate): Promise<Category> {
    return this.put<Category>(`/categories/${categoryId}`, categoryData);
  }

  async deleteCategory(categoryId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/categories/${categoryId}`);
  }

  async getCategoryProducts(
    categoryId: string,
    params: CategoryProductsQueryParams = {}
  ): Promise<ProductListResponse> {
    return this.get<ProductListResponse>(`/categories/${categoryId}/products`, params);
  }

  async getCategoryStats(categoryId: string): Promise<CategoryStats> {
    return this.get<CategoryStats>(`/categories/${categoryId}/stats`);
  }

  // ==================== File Upload APIs ====================

  async uploadImage(file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<{ image_url: string }>({
      method: 'POST',
      url: '/upload/image',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

// ==================== Export ====================

export const api = new ApiService();

// Export axios instance for custom requests if needed
export { apiClient };

// Export utility functions
export const setAuthToken = (token: string) => {
  tokenStorage.set(token);
};

export const clearAuthToken = () => {
  tokenStorage.remove();
};

export const getAuthToken = () => {
  return tokenStorage.get();
};

// ==================== React Query Query Keys ====================

export const queryKeys = {
  // Auth
  currentUser: ['currentUser'] as const,
  
  // Users
  users: (params?: any) => ['users', params] as const,
  user: (userId: string) => ['user', userId] as const,
  userStats: (userId: string) => ['userStats', userId] as const,
  
  // Products
  products: (params?: ProductQueryParams) => ['products', params] as const,
  product: (productId: string) => ['product', productId] as const,
  userProducts: (userId: string, params?: ProductQueryParams) => ['userProducts', userId, params] as const,
  
  // Categories
  categories: ['categories'] as const,
  categoriesWithCount: ['categoriesWithCount'] as const,
  category: (categoryId: string) => ['category', categoryId] as const,
  categoryProducts: (categoryId: string, params?: CategoryProductsQueryParams) => 
    ['categoryProducts', categoryId, params] as const,
  categoryStats: (categoryId: string) => ['categoryStats', categoryId] as const,
} as const;