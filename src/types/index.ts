/**
 * BondMCP SDK Type Definitions
 * TypeScript interfaces and types for the BondMCP Healthcare Platform API
 */

export interface BondMCPClientConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  userAgent?: string;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  params?: Record<string, any>;
  data?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  message: string;
  version: string;
  timestamp?: string;
}

export interface PatientSummary {
  patient_id: string;
  name: string;
  age?: number;
  gender?: string;
  medical_history?: string[];
  current_medications?: string[];
  allergies?: string[];
  last_visit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DigitalPrescription {
  prescription_id: string;
  patient_id: string;
  prescriber_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  refills_remaining?: number;
  prescribed_date: string;
  expiry_date?: string;
  status: string;
}

export interface HealthcareProgram {
  program_id: string;
  name: string;
  description: string;
  eligibility_criteria: string[];
  benefits: string[];
  enrollment_status: string;
  start_date?: string;
  end_date?: string;
}

export interface ResearchPaper {
  paper_id: string;
  title: string;
  authors: string[];
  abstract: string;
  publication_date: string;
  journal: string;
  doi?: string;
  pmid?: string;
  keywords?: string[];
  url?: string;
}

export interface ApiKey {
  key_id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit_tier: string;
  created_at: string;
  last_used?: string;
  expires_at?: string;
  is_active: boolean;
}

export interface WebhookEvent {
  event_id: string;
  event_type: string;
  payload: Record<string, any>;
  timestamp: string;
  source: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: string;
  window_seconds: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface CreatePatientData {
  patient_id: string;
  name: string;
  age?: number;
  gender?: string;
  medical_history?: string[];
  current_medications?: string[];
  allergies?: string[];
}

export interface CreatePrescriptionData {
  patient_id: string;
  prescriber_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  refills_remaining?: number;
}

export interface SearchPapersParams {
  q: string;
  limit?: number;
  offset?: number;
}

export interface SaveResearchData {
  paper_id: string;
  notes?: string;
}

export interface CreateApiKeyData {
  name: string;
  permissions: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RefreshTokenData {
  refresh_token: string;
}

// Error types
export class BondMCPError extends Error {
  public statusCode?: number;
  public responseData?: Record<string, any>;

  constructor(message: string, statusCode?: number, responseData?: Record<string, any>) {
    super(message);
    this.name = 'BondMCPError';
    this.statusCode = statusCode;
    this.responseData = responseData;
  }
}

export class AuthenticationError extends BondMCPError {
  constructor(message: string, statusCode?: number, responseData?: Record<string, any>) {
    super(message, statusCode, responseData);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends BondMCPError {
  constructor(message: string, statusCode?: number, responseData?: Record<string, any>) {
    super(message, statusCode, responseData);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends BondMCPError {
  constructor(message: string, statusCode?: number, responseData?: Record<string, any>) {
    super(message, statusCode, responseData);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends BondMCPError {
  constructor(message: string, statusCode?: number, responseData?: Record<string, any>) {
    super(message, statusCode, responseData);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends BondMCPError {
  public retryAfter?: number;

  constructor(
    message: string,
    retryAfter?: number,
    statusCode?: number,
    responseData?: Record<string, any>
  ) {
    super(message, statusCode, responseData);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends BondMCPError {
  constructor(message: string, statusCode?: number, responseData?: Record<string, any>) {
    super(message, statusCode, responseData);
    this.name = 'ServerError';
  }
}

export class NetworkError extends BondMCPError {
  constructor(message: string, statusCode?: number, responseData?: Record<string, any>) {
    super(message, statusCode, responseData);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends BondMCPError {
  constructor(message: string, statusCode?: number, responseData?: Record<string, any>) {
    super(message, statusCode, responseData);
    this.name = 'TimeoutError';
  }
}

export class ConfigurationError extends BondMCPError {
  constructor(message: string, statusCode?: number, responseData?: Record<string, any>) {
    super(message, statusCode, responseData);
    this.name = 'ConfigurationError';
  }
}

