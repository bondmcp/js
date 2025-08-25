# BondMCP JavaScript/TypeScript SDK

[![npm version](https://badge.fury.io/js/bondmcp-js.svg)](https://badge.fury.io/js/bondmcp-js)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive JavaScript/TypeScript client library for the BondMCP Healthcare Platform API. This SDK provides easy access to healthcare management, medical research, and enterprise features through a clean, intuitive interface.

## Features

- **Healthcare Platform**: Patient management, digital prescriptions, healthcare programs
- **Research Platform**: Medical research papers, knowledge base, research saving
- **Vendor Integration**: Webhook handling, data endpoints
- **Enterprise Features**: Authentication, rate limiting, monitoring
- **TypeScript Support**: Full type safety with comprehensive type definitions
- **Promise-based**: Modern async/await support with axios
- **Auto-retry**: Built-in retry logic with exponential backoff
- **Rate Limiting**: Automatic rate limit handling
- **Browser & Node.js**: Works in both browser and Node.js environments

## Installation

```bash
npm install bondmcp-js
```

Or with yarn:

```bash
yarn add bondmcp-js
```

## Quick Start

### TypeScript/ES6+

```typescript
import { BondMCPClient } from 'bondmcp-js';

// Initialize client
const client = new BondMCPClient({
  apiKey: 'your_api_key'
});

// Check API health
const health = await client.health.getStatus();
console.log(`API Status: ${health.status}`);

// Get patient summary
const patient = await client.patients.getSummary('patient_123');
console.log(`Patient: ${patient.name}`);

// Search research papers
const papers = await client.research.searchPapers('diabetes treatment', 10);
papers.forEach(paper => {
  console.log(`Paper: ${paper.title}`);
});
```

### JavaScript (CommonJS)

```javascript
const { BondMCPClient } = require('bondmcp-js');

// Initialize client
const client = new BondMCPClient({
  apiKey: 'your_api_key'
});

// Use with async/await
async function example() {
  try {
    const health = await client.health.getStatus();
    console.log(`API Status: ${health.status}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();
```

### Browser (UMD)

```html
<script src="https://unpkg.com/bondmcp-js@latest/dist/index.umd.js"></script>
<script>
  const client = new BondMCP.BondMCPClient({
    apiKey: 'your_api_key'
  });
  
  client.health.getStatus().then(health => {
    console.log('API Status:', health.status);
  });
</script>
```

## Configuration

### Client Configuration

```typescript
import { BondMCPClient } from 'bondmcp-js';

const client = new BondMCPClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.bondmcp.com', // Default
  timeout: 30000, // Request timeout in milliseconds
  maxRetries: 3, // Maximum retry attempts
  retryDelay: 1000, // Delay between retries in milliseconds
  userAgent: 'my-app/1.0.0' // Custom user agent
});
```

### Environment Variables

You can also set your API key as an environment variable:

```bash
export BONDMCP_API_KEY="your_api_key"
```

```typescript
// API key will be automatically picked up from environment
const client = new BondMCPClient();
```

## API Reference

### Health Endpoints

```typescript
// Basic health check
const health = await client.health.getStatus();

// Live status (for load balancers)
const live = await client.health.getLiveStatus();

// Readiness status (for orchestrators)
const ready = await client.health.getReadyStatus();
```

### Patient Management

```typescript
// Get patient summary
const patient = await client.patients.getSummary('patient_123');

// Create patient summary
const patientData = {
  patient_id: 'patient_456',
  name: 'John Doe',
  age: 35,
  gender: 'male'
};
const newPatient = await client.patients.createSummary(patientData);
```

### Digital Prescriptions

```typescript
// Get prescription
const prescription = await client.prescriptions.getPrescription('rx_123');

// Create prescription
const prescriptionData = {
  patient_id: 'patient_123',
  prescriber_id: 'doctor_456',
  medication_name: 'Metformin',
  dosage: '500mg',
  frequency: 'twice daily',
  duration: '30 days'
};
const newPrescription = await client.prescriptions.createPrescription(prescriptionData);
```

### Healthcare Programs

```typescript
// Get program details
const program = await client.programs.getProgram('program_123');

// Enroll patient in program
const result = await client.programs.enrollPatient('program_123', 'patient_456');
```

### Research Platform

```typescript
// Search medical papers
const papers = await client.research.searchPapers('diabetes treatment', 20);

// Save research with notes
const result = await client.research.saveResearch(
  'pubmed_12345',
  'Relevant for diabetes management protocol'
);
```

### Authentication

```typescript
// Login and get token
const token = await client.auth.login('username', 'password');

// Refresh token
const newToken = await client.auth.refreshToken(token.refresh_token);

// Update client with new token
client.setApiKey(newToken.access_token);
```

### API Key Management

```typescript
// List API keys
const keys = await client.apiKeys.listKeys();

// Create new API key
const newKey = await client.apiKeys.createKey(
  'My Application',
  ['read:patients', 'write:prescriptions']
);

// Revoke API key
const result = await client.apiKeys.revokeKey('key_123');
```

### Webhook Handling

```typescript
// Handle incoming webhook
const webhookData = {
  event: 'patient_updated',
  payload: { patient_id: 'patient_123' }
};
const result = await client.webhooks.handleWebhook(webhookData);
```

## Error Handling

The SDK provides specific error types for different conditions:

```typescript
import {
  BondMCPClient,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  ServerError
} from 'bondmcp-js';

const client = new BondMCPClient({ apiKey: 'your_api_key' });

try {
  const patient = await client.patients.getSummary('patient_123');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof NotFoundError) {
    console.error('Patient not found');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error instanceof ValidationError) {
    console.error(`Validation error: ${error.message}`);
  } else if (error instanceof ServerError) {
    console.error('Server error occurred');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## Rate Limiting

The SDK automatically handles rate limiting with exponential backoff:

```typescript
// Rate limits are handled automatically
// The client will retry with exponential backoff
// and respect Retry-After headers

const client = new BondMCPClient({
  apiKey: 'your_api_key',
  maxRetries: 5, // Increase retries for rate-limited endpoints
  retryDelay: 2000 // Increase base delay
});
```

## TypeScript Support

The SDK is written in TypeScript and provides comprehensive type definitions:

```typescript
import { 
  BondMCPClient, 
  PatientSummary, 
  DigitalPrescription,
  HealthStatus 
} from 'bondmcp-js';

const client = new BondMCPClient({ apiKey: 'your_api_key' });

// Type-safe patient data
const patient: PatientSummary = await client.patients.getSummary('patient_123');
console.log(`Patient age: ${patient.age}`); // Type: number | undefined
console.log(`Allergies: ${patient.allergies}`); // Type: string[] | undefined

// Type-safe prescription data
const prescription: DigitalPrescription = await client.prescriptions.getPrescription('rx_123');
console.log(`Medication: ${prescription.medication_name}`); // Type: string
console.log(`Refills: ${prescription.refills_remaining}`); // Type: number | undefined

// Type-safe health status
const health: HealthStatus = await client.health.getStatus();
console.log(`Status: ${health.status}`); // Type: string
```

## Development

### Setting up Development Environment

```bash
git clone https://github.com/auroracapital/bondmcp-js.git
cd bondmcp-js

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Building

```bash
# Build for production
npm run build

# Build and watch for changes
npm run build:watch
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Code Quality

```bash
# Lint TypeScript files
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Type checking
npm run type-check
```

## Browser Compatibility

The SDK supports all modern browsers:

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

For older browsers, you may need to include polyfills for:
- Promise
- fetch (if using in browser without axios)
- Object.assign

## Node.js Compatibility

- Node.js 14.0.0 or higher

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://docs.bondmcp.com](https://docs.bondmcp.com)
- **API Reference**: [https://api.bondmcp.com/docs](https://api.bondmcp.com/docs)
- **Issues**: [GitHub Issues](https://github.com/auroracapital/bondmcp-js/issues)
- **Email**: [support@bondmcp.com](mailto:support@bondmcp.com)

## Changelog

### Version 2.1.0

- Initial release with comprehensive API coverage
- Full TypeScript support with type definitions
- Promise-based API with async/await support
- Automatic rate limiting and retry logic
- Complete healthcare, research, and enterprise features
- Browser and Node.js compatibility

---

**BondMCP JavaScript/TypeScript SDK** - Empowering healthcare innovation through seamless API integration.

