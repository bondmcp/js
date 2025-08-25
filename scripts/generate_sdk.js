#!/usr/bin/env node
/**
 * SDK Generation Script
 * Generates JavaScript/TypeScript SDK code from OpenAPI specification and API configuration
 */

const fs = require('fs');
const path = require('path');

function loadApiData() {
  const config = JSON.parse(fs.readFileSync('api_config.json', 'utf8'));
  const spec = JSON.parse(fs.readFileSync('openapi_spec.json', 'utf8'));
  return { config, spec };
}

function generateTypes(config) {
  let typesCode = `/**
 * BondMCP SDK Type Definitions
 * Auto-generated TypeScript interfaces and types for the BondMCP Healthcare Platform API
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

`;

  // Generate interfaces for each endpoint's response
  const endpoints = config.endpoints || [];
  
  for (const endpoint of endpoints) {
    const outputExample = endpoint.output_example;
    if (outputExample && typeof outputExample === 'object') {
      const interfaceName = endpoint.name.replace(/\s+/g, '').replace(/-/g, '');
      
      typesCode += `export interface ${interfaceName} {\n`;
      
      // Generate fields from output example
      for (const [fieldName, fieldValue] of Object.entries(outputExample)) {
        const fieldType = getTypeScriptType(fieldValue);
        typesCode += `  ${fieldName}: ${fieldType};\n`;
      }
      
      typesCode += '}\n\n';
    }
  }

  // Add error classes
  typesCode += `
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
`;

  return typesCode;
}

function getTypeScriptType(value) {
  if (typeof value === 'string') {
    return 'string';
  } else if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  } else if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = getTypeScriptType(value[0]);
      return `${itemType}[]`;
    }
    return 'any[]';
  } else if (typeof value === 'object' && value !== null) {
    return 'Record<string, any>';
  } else {
    return 'any';
  }
}

function generateClientMethods(config) {
  let methodsCode = '';
  
  const endpoints = config.endpoints || [];
  
  // Group endpoints by service
  const services = {};
  for (const endpoint of endpoints) {
    const tags = endpoint.tags || ['General'];
    const serviceName = tags[0] || 'General';
    
    if (!services[serviceName]) {
      services[serviceName] = [];
    }
    services[serviceName].push(endpoint);
  }
  
  // Generate service classes
  for (const [serviceName, serviceEndpoints] of Object.entries(services)) {
    const className = `${serviceName.replace(/\s+/g, '').replace(/-/g, '')}Service`;
    
    methodsCode += `
/**
 * ${serviceName} service
 */
export class ${className} extends BaseService {
`;
    
    for (const endpoint of serviceEndpoints) {
      const methodCode = generateMethodCode(endpoint);
      methodsCode += `  ${methodCode}\n`;
    }
    
    methodsCode += '}\n';
  }
  
  return methodsCode;
}

function generateMethodCode(endpoint) {
  const methodName = endpoint.id.split(':')[0].replace(/\./g, '_').replace(/-/g, '_');
  const httpMethod = endpoint.method.toUpperCase();
  const path = endpoint.path;
  const description = endpoint.description;
  
  // Extract path parameters
  const pathParams = [...path.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
  
  // Generate method signature
  const params = [];
  for (const param of pathParams) {
    params.push(`${param}: string`);
  }
  
  // Add data parameter for POST/PUT methods
  if (['POST', 'PUT', 'PATCH'].includes(httpMethod)) {
    params.push('data: Record<string, any>');
  }
  
  // Add query parameters for GET methods
  if (httpMethod === 'GET' && endpoint.input_example) {
    params.push('params?: Record<string, any>');
  }
  
  const paramsStr = params.join(', ');
  
  // Generate method body
  const requestArgs = generateRequestArgs(pathParams, httpMethod);
  
  return `/**
   * ${description}
   */
  async ${methodName}(${paramsStr}): Promise<any> {
    return this.client.makeRequest({
      method: '${httpMethod}',
      endpoint: '${path}'${requestArgs}
    });
  }`;
}

function generateRequestArgs(pathParams, httpMethod) {
  const args = [];
  
  // Replace path parameters
  if (pathParams.length > 0) {
    let pathReplacement = '';
    for (const param of pathParams) {
      pathReplacement += `.replace('{${param}}', ${param})`;
    }
    args.push(`endpoint: '${pathReplacement}'`);
  }
  
  // Add data for POST/PUT methods
  if (['POST', 'PUT', 'PATCH'].includes(httpMethod)) {
    args.push('data');
  }
  
  // Add params for GET methods
  if (httpMethod === 'GET') {
    args.push('params');
  }
  
  if (args.length > 0) {
    return ',\n      ' + args.join(',\n      ');
  }
  return '';
}

function updateClientFile(config) {
  // Read current client file
  const clientPath = 'src/client/client.ts';
  let content = fs.readFileSync(clientPath, 'utf8');
  
  // Generate new service methods
  const newMethods = generateClientMethods(config);
  
  // Find insertion point (after existing services)
  const insertionPoint = content.lastIndexOf('export class ApiKeyService extends BaseService');
  if (insertionPoint === -1) {
    console.warn('Warning: Could not find insertion point in client.ts');
    return;
  }
  
  // Find end of last service class
  let endPoint = content.indexOf('\n}', insertionPoint);
  if (endPoint !== -1) {
    endPoint = content.indexOf('\n', endPoint + 2);
  }
  if (endPoint === -1) {
    endPoint = content.length;
  }
  
  // Insert new methods
  const updatedContent = content.substring(0, endPoint) + newMethods + content.substring(endPoint);
  
  // Write updated content
  fs.writeFileSync(clientPath, updatedContent);
}

function updateVersionInFiles(newVersion) {
  const filesToUpdate = [
    {
      path: 'package.json',
      pattern: /"version":\s*"[^"]*"/,
      replacement: `"version": "${newVersion}"`
    },
    {
      path: 'src/index.ts',
      pattern: /export const VERSION = '[^']*'/,
      replacement: `export const VERSION = '${newVersion}'`
    }
  ];
  
  for (const { path: filePath, pattern, replacement } of filesToUpdate) {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(new RegExp(pattern), replacement);
      fs.writeFileSync(filePath, content);
    }
  }
}

function updateReadme(config) {
  const readmePath = 'README.md';
  if (!fs.existsSync(readmePath)) {
    return;
  }
  
  let content = fs.readFileSync(readmePath, 'utf8');
  
  // Update endpoint count
  const endpointCount = (config.endpoints || []).length;
  content = content.replace(/(\d+)\+ endpoints/g, `${endpointCount}+ endpoints`);
  
  // Update version in README
  const version = config.version || '2.1.0';
  content = content.replace(/Version \d+\.\d+\.\d+/g, `Version ${version}`);
  
  fs.writeFileSync(readmePath, content);
}

function main() {
  console.log('Generating JavaScript/TypeScript SDK from API specification...');
  
  try {
    // Load API data
    const { config, spec } = loadApiData();
    
    // Generate types
    console.log('Generating TypeScript types...');
    const typesCode = generateTypes(config);
    
    // Update types file
    fs.writeFileSync('src/types/index.ts', typesCode);
    
    // Update client file
    console.log('Updating client methods...');
    updateClientFile(config);
    
    // Update documentation
    console.log('Updating documentation...');
    updateReadme(config);
    
    console.log('SDK generation complete!');
    
  } catch (error) {
    console.error('Error generating SDK:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

