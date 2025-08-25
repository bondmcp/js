/**
 * BondMCP JavaScript/TypeScript SDK
 * A comprehensive client library for the BondMCP Healthcare Platform API
 * 
 * @example
 * ```typescript
 * import { BondMCPClient } from 'bondmcp-js';
 * 
 * const client = new BondMCPClient({
 *   apiKey: 'your_api_key'
 * });
 * 
 * // Check API health
 * const health = await client.health.getStatus();
 * console.log(health.status);
 * ```
 */

// Main client
export { BondMCPClient } from './client/client';

// Services
export {
  HealthService,
  PatientService,
  PrescriptionService,
  ProgramService,
  ResearchService,
  WebhookService,
  AuthService,
  ApiKeyService,
} from './client/client';

// Types and interfaces
export type {
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
  RateLimitInfo,
  PaginatedResponse,
  AuthToken,
  CreatePatientData,
  CreatePrescriptionData,
  SearchPapersParams,
  SaveResearchData,
  CreateApiKeyData,
  LoginCredentials,
  RefreshTokenData,
} from './types';

// Exceptions
export {
  BondMCPError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  NetworkError,
  TimeoutError,
  ConfigurationError,
} from './types';

// Version
export const VERSION = '2.1.0';

// Default export
export default BondMCPClient;

