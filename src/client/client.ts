/**
 * BondMCP JavaScript/TypeScript Client
 * Main client for the BondMCP Healthcare Platform API
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  BondMCPClientConfig,
  RequestConfig,
  ApiResponse,
  HealthStatus,
  PatientSummary,
  DigitalPrescription,
  HealthcareProgram,
  ResearchPaper,
  ApiKey,
  WebhookEvent,
  AuthToken,
  CreatePatientData,
  CreatePrescriptionData,
  SearchPapersParams,
  SaveResearchData,
  CreateApiKeyData,
  LoginCredentials,
  RefreshTokenData,
  BondMCPError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  NetworkError,
  TimeoutError,
} from '../types';

/**
 * Main BondMCP client for accessing the Healthcare Platform API
 * 
 * @example
 * ```typescript
 * import { BondMCPClient } from 'bondmcp-js';
 * 
 * const client = new BondMCPClient({
 *   apiKey: 'your_api_key',
 *   baseUrl: 'https://api.bondmcp.com'
 * });
 * 
 * // Check API health
 * const health = await client.health.getStatus();
 * console.log(health.status);
 * 
 * // Get patient summary
 * const patient = await client.patients.getSummary('patient_123');
 * console.log(patient.name);
 * ```
 */
export class BondMCPClient {
  private axiosInstance: AxiosInstance;
  private config: Required<BondMCPClientConfig>;

  public readonly health: HealthService;
  public readonly patients: PatientService;
  public readonly prescriptions: PrescriptionService;
  public readonly programs: ProgramService;
  public readonly research: ResearchService;
  public readonly webhooks: WebhookService;
  public readonly auth: AuthService;
  public readonly apiKeys: ApiKeyService;

  constructor(config: BondMCPClientConfig = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      baseUrl: config.baseUrl || 'https://api.bondmcp.com',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      userAgent: config.userAgent || 'bondmcp-js/2.1.0',
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': this.config.userAgent,
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
    });

    // Initialize services
    this.health = new HealthService(this);
    this.patients = new PatientService(this);
    this.prescriptions = new PrescriptionService(this);
    this.programs = new ProgramService(this);
    this.research = new ResearchService(this);
    this.webhooks = new WebhookService(this);
    this.auth = new AuthService(this);
    this.apiKeys = new ApiKeyService(this);
  }

  /**
   * Make an HTTP request to the API with retry logic
   */
  async makeRequest<T = any>(requestConfig: RequestConfig): Promise<T> {
    const { method, endpoint, params, data, headers } = requestConfig;

    let lastError: Error;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response: AxiosResponse<T> = await this.axiosInstance.request({
          method,
          url: endpoint,
          params,
          data,
          headers,
        });

        return response.data;
      } catch (error) {
        lastError = this.handleError(error as AxiosError);

        // Handle rate limiting
        if (lastError instanceof RateLimitError && attempt < this.config.maxRetries) {
          const retryAfter = lastError.retryAfter || this.config.retryDelay;
          await this.sleep(retryAfter);
          continue;
        }

        // Retry on network errors
        if (
          (lastError instanceof NetworkError || lastError instanceof TimeoutError) &&
          attempt < this.config.maxRetries
        ) {
          await this.sleep(this.config.retryDelay * Math.pow(2, attempt));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError!;
  }

  /**
   * Handle axios errors and convert to BondMCP errors
   */
  private handleError(error: AxiosError): BondMCPError {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new TimeoutError(`Request timed out: ${error.message}`);
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new NetworkError(`Network error: ${error.message}`);
    }

    if (!error.response) {
      return new NetworkError(`Network error: ${error.message}`);
    }

    const { status, data } = error.response;
    const message = (data as any)?.message || `HTTP ${status}`;
    const responseData = data as Record<string, any>;

    switch (status) {
      case 401:
        return new AuthenticationError(message, status, responseData);
      case 403:
        return new AuthorizationError(message, status, responseData);
      case 404:
        return new NotFoundError(message, status, responseData);
      case 422:
        return new ValidationError(message, status, responseData);
      case 429:
        const retryAfter = parseInt(error.response.headers['retry-after'] || '0') * 1000;
        return new RateLimitError(message, retryAfter, status, responseData);
      default:
        if (status >= 500) {
          return new ServerError(message, status, responseData);
        }
        return new BondMCPError(message, status, responseData);
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update API key
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<BondMCPClientConfig>> {
    return { ...this.config };
  }
}

/**
 * Base service class
 */
abstract class BaseService {
  constructor(protected client: BondMCPClient) {}
}

/**
 * Health and monitoring service
 */
export class HealthService extends BaseService {
  /**
   * Get API health status
   */
  async getStatus(): Promise<HealthStatus> {
    return this.client.makeRequest<HealthStatus>({
      method: 'GET',
      endpoint: '/health',
    });
  }

  /**
   * Get live health status
   */
  async getLiveStatus(): Promise<HealthStatus> {
    return this.client.makeRequest<HealthStatus>({
      method: 'GET',
      endpoint: '/health/live',
    });
  }

  /**
   * Get readiness status
   */
  async getReadyStatus(): Promise<HealthStatus> {
    return this.client.makeRequest<HealthStatus>({
      method: 'GET',
      endpoint: '/health/ready',
    });
  }
}

/**
 * Patient management service
 */
export class PatientService extends BaseService {
  /**
   * Get patient summary
   */
  async getSummary(patientId: string): Promise<PatientSummary> {
    return this.client.makeRequest<PatientSummary>({
      method: 'GET',
      endpoint: `/patients/${patientId}/summary`,
    });
  }

  /**
   * Create patient summary
   */
  async createSummary(patientData: CreatePatientData): Promise<PatientSummary> {
    return this.client.makeRequest<PatientSummary>({
      method: 'POST',
      endpoint: '/patients/summary',
      data: patientData,
    });
  }
}

/**
 * Digital prescription service
 */
export class PrescriptionService extends BaseService {
  /**
   * Get digital prescription
   */
  async getPrescription(prescriptionId: string): Promise<DigitalPrescription> {
    return this.client.makeRequest<DigitalPrescription>({
      method: 'GET',
      endpoint: `/prescriptions/${prescriptionId}`,
    });
  }

  /**
   * Create digital prescription
   */
  async createPrescription(prescriptionData: CreatePrescriptionData): Promise<DigitalPrescription> {
    return this.client.makeRequest<DigitalPrescription>({
      method: 'POST',
      endpoint: '/prescriptions',
      data: prescriptionData,
    });
  }
}

/**
 * Healthcare program service
 */
export class ProgramService extends BaseService {
  /**
   * Get healthcare program
   */
  async getProgram(programId: string): Promise<HealthcareProgram> {
    return this.client.makeRequest<HealthcareProgram>({
      method: 'GET',
      endpoint: `/programs/${programId}`,
    });
  }

  /**
   * Enroll patient in healthcare program
   */
  async enrollPatient(programId: string, patientId: string): Promise<{ message: string }> {
    return this.client.makeRequest<{ message: string }>({
      method: 'POST',
      endpoint: `/programs/${programId}/enroll`,
      data: { patient_id: patientId },
    });
  }
}

/**
 * Research and medical paper service
 */
export class ResearchService extends BaseService {
  /**
   * Search medical research papers
   */
  async searchPapers(query: string, limit: number = 20): Promise<ResearchPaper[]> {
    const response = await this.client.makeRequest<{ papers: ResearchPaper[] }>({
      method: 'GET',
      endpoint: '/research/papers',
      params: { q: query, limit },
    });
    return response.papers;
  }

  /**
   * Save research paper with notes
   */
  async saveResearch(paperId: string, notes?: string): Promise<{ message: string }> {
    const data: SaveResearchData = { paper_id: paperId };
    if (notes) {
      data.notes = notes;
    }

    return this.client.makeRequest<{ message: string }>({
      method: 'POST',
      endpoint: '/research/save',
      data,
    });
  }
}

/**
 * Webhook handling service
 */
export class WebhookService extends BaseService {
  /**
   * Handle incoming webhook
   */
  async handleWebhook(eventData: Record<string, any>): Promise<{ message: string }> {
    return this.client.makeRequest<{ message: string }>({
      method: 'POST',
      endpoint: '/webhooks',
      data: eventData,
    });
  }
}

/**
 * Authentication service
 */
export class AuthService extends BaseService {
  /**
   * Authenticate user and get token
   */
  async login(username: string, password: string): Promise<AuthToken> {
    return this.client.makeRequest<AuthToken>({
      method: 'POST',
      endpoint: '/auth/login',
      data: { username, password },
    });
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    return this.client.makeRequest<AuthToken>({
      method: 'POST',
      endpoint: '/auth/refresh',
      data: { refresh_token: refreshToken },
    });
  }
}

/**
 * API key management service
 */
export class ApiKeyService extends BaseService {
  /**
   * Create new API key
   */
  async createKey(name: string, permissions: string[]): Promise<ApiKey> {
    return this.client.makeRequest<ApiKey>({
      method: 'POST',
      endpoint: '/api-keys',
      data: { name, permissions },
    });
  }

  /**
   * List all API keys
   */
  async listKeys(): Promise<ApiKey[]> {
    const response = await this.client.makeRequest<{ keys: ApiKey[] }>({
      method: 'GET',
      endpoint: '/api-keys',
    });
    return response.keys;
  }

  /**
   * Revoke API key
   */
  async revokeKey(keyId: string): Promise<{ message: string }> {
    return this.client.makeRequest<{ message: string }>({
      method: 'DELETE',
      endpoint: `/api-keys/${keyId}`,
    });
  }
}

