#!/usr/bin/env node
/**
 * API Change Detection Script
 * Checks for changes in the BondMCP API and determines if SDK update is needed
 */

const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.bondmcp.com';

async function getApiConfiguration() {
  try {
    const response = await axios.get(`${API_BASE_URL}/.well-known/mcp-configuration`, {
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching API configuration:', error.message);
    process.exit(1);
  }
}

async function getOpenApiSpec() {
  try {
    const response = await axios.get(`${API_BASE_URL}/openapi.json`, {
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching OpenAPI spec:', error.message);
    process.exit(1);
  }
}

function calculateApiHash(config, spec) {
  const combinedData = {
    config: config,
    spec: spec
  };
  
  // Sort keys for consistent hashing
  const jsonStr = JSON.stringify(combinedData, Object.keys(combinedData).sort());
  return crypto.createHash('sha256').update(jsonStr).digest('hex');
}

function loadPreviousHash() {
  const hashFile = '.api_hash';
  if (fs.existsSync(hashFile)) {
    return fs.readFileSync(hashFile, 'utf8').trim();
  }
  return null;
}

function saveCurrentHash(apiHash) {
  fs.writeFileSync('.api_hash', apiHash);
}

function generateNewVersion(currentVersion) {
  // Parse current version (e.g., "2.1.0")
  const parts = currentVersion.split('.');
  if (parts.length !== 3) {
    return "2.1.1"; // Default fallback
  }
  
  let [major, minor, patch] = parts.map(Number);
  
  // Increment patch version for API updates
  patch += 1;
  
  return `${major}.${minor}.${patch}`;
}

function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version || "2.1.0";
  } catch (error) {
    return "2.1.0"; // Default fallback
  }
}

function setGitHubOutput(name, value) {
  console.log(`::set-output name=${name}::${value}`);
}

async function main() {
  console.log('Checking for API changes...');
  
  try {
    // Fetch current API data
    const config = await getApiConfiguration();
    const spec = await getOpenApiSpec();
    
    // Calculate current hash
    const currentHash = calculateApiHash(config, spec);
    
    // Load previous hash
    const previousHash = loadPreviousHash();
    
    // Check if API has changed
    const apiChanged = previousHash !== currentHash;
    
    if (apiChanged) {
      console.log('API changes detected!');
      console.log(`Previous hash: ${previousHash}`);
      console.log(`Current hash: ${currentHash}`);
      
      // Generate new version
      const currentVersion = getCurrentVersion();
      const newVersion = generateNewVersion(currentVersion);
      
      console.log(`Current version: ${currentVersion}`);
      console.log(`New version: ${newVersion}`);
      
      // Save new hash
      saveCurrentHash(currentHash);
      
      // Set GitHub Actions outputs
      setGitHubOutput('api_changed', 'true');
      setGitHubOutput('new_version', newVersion);
      
      // Save API data for SDK generation
      fs.writeFileSync('api_config.json', JSON.stringify(config, null, 2));
      fs.writeFileSync('openapi_spec.json', JSON.stringify(spec, null, 2));
      
    } else {
      console.log('No API changes detected.');
      setGitHubOutput('api_changed', 'false');
      setGitHubOutput('new_version', getCurrentVersion());
    }
    
  } catch (error) {
    console.error('Error in main function:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

