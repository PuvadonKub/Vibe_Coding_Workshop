/**
 * Type definitions for the Student Marketplace application
 * These types should match the Pydantic schemas from the backend
 */

// ==================== User Types ====================

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
}

export interface UserStats {
  user_id: string;
  username: string;
  member_since: string;
  total_products: number;
  available_products: number;
  sold_products: number;
  pending_products: number;
  profile_completion: number;
}

// ==================== Product Types ====================

export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  image_url?: string;
  images?: string[];
  status: ProductStatus;
  seller_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  seller: User;
  category: Category;
}

export interface ProductCreate {
  title: string;
  description?: string;
  price: number;
  image_url?: string;
  images?: string[];
  status?: ProductStatus;
  category_id: string;
}

export interface ProductUpdate {
  title?: string;
  description?: string;
  price?: number;
  image_url?: string;
  images?: string[];
  status?: ProductStatus;
  category_id?: string;
}

export interface ProductFilter {
  category_id?: string;
  min_price?: number;
  max_price?: number;
  status?: ProductStatus;
  search?: string;
  seller_id?: string;
}

export type ProductStatus = 'available' | 'sold' | 'pending';

// ==================== Category Types ====================

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithProductCount extends Category {
  product_count: number;
}

export interface CategoryCreate {
  name: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
}

export interface CategoryStats {
  category_id: string;
  category_name: string;
  total_products: number;
  available_products: number;
  sold_products: number;
  price_stats: {
    min_price: number;
    max_price: number;
    avg_price: number;
  };
}

// ==================== API Response Types ====================

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  products?: T[];
  categories?: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ProductListResponse extends PaginatedResponse<Product> {
  products: Product[];
}

export interface CategoryListResponse {
  categories: Category[] | CategoryWithProductCount[];
  total: number;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface AuthResponse extends AuthToken {
  user: User;
}

// ==================== Form Types ====================

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProductFormData {
  title: string;
  description?: string;
  price: number;
  image_url?: string;
  images?: string[];
  category_id: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

export interface UserProfileFormData {
  username: string;
  email: string;
}

// ==================== Query Types ====================

export interface ProductQueryParams {
  page?: number;
  per_page?: number;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  status?: ProductStatus | 'all';
  search?: string;
  seller_id?: string;
}

export interface CategoryProductsQueryParams {
  page?: number;
  per_page?: number;
  status?: ProductStatus | 'all';
  min_price?: number;
  max_price?: number;
}

// ==================== Error Types ====================

export interface ApiError {
  message: string;
  detail?: string;
  status_code?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormError {
  [key: string]: string | undefined;
}

// ==================== UI State Types ====================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface AuthState extends LoadingState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ProductsState extends LoadingState {
  products: Product[];
  total: number;
  page: number;
  total_pages: number;
  filters: ProductFilter;
}

export interface CategoriesState extends LoadingState {
  categories: Category[];
  total: number;
}

// ==================== Route Types ====================

export interface RouteParams {
  id?: string;
  categoryId?: string;
  sellerId?: string;
}

// ==================== Theme Types ====================

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// ==================== Utility Types ====================

export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  key: keyof Product;
  label: string;
  order: SortOrder;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// ==================== Constants ====================

export const PRODUCT_STATUSES: { value: ProductStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'pending', label: 'Pending' },
];

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

// ==================== Type Guards ====================

export const isProduct = (obj: any): obj is Product => {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string';
};

export const isUser = (obj: any): obj is User => {
  return obj && typeof obj.id === 'string' && typeof obj.username === 'string';
};

export const isCategory = (obj: any): obj is Category => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};

// ==================== Export All ====================

export type {
  // Re-export all types for convenience
  User as UserType,
  Product as ProductType,
  Category as CategoryType,
  ApiResponse as ApiResponseType,
  AuthState as AuthStateType,
};