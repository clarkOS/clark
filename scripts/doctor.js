#!/usr/bin/env node

/**
 * ClarkOS Doctor Script
 * Validates environment and prerequisites before running the agent
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

const PASS = `${colors.green}PASS${colors.reset}`;
const FAIL = `${colors.red}FAIL${colors.reset}`;
const WARN = `${colors.yellow}WARN${colors.reset}`;
const INFO = `${colors.blue}INFO${colors.reset}`;

let hasErrors = false;
let hasWarnings = false;

function log(status, message, detail = '') {
  const detailStr = detail ? ` ${colors.dim}${detail}${colors.reset}` : '';
  console.log(`  [${status}] ${message}${detailStr}`);
}

function section(title) {
  console.log(`\n${colors.blue}${title}${colors.reset}`);
  console.log('─'.repeat(50));
}

function getVersion(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function checkNodeVersion() {
  section('Node.js');

  const version = getVersion('node --version');
  if (!version) {
    log(FAIL, 'Node.js not found');
    hasErrors = true;
    return;
  }

  const major = parseInt(version.replace('v', '').split('.')[0]);
  if (major >= 18) {
    log(PASS, `Node.js ${version}`, '>= 18 required');
  } else {
    log(FAIL, `Node.js ${version}`, '>= 18 required');
    hasErrors = true;
  }
}

function checkNpm() {
  const version = getVersion('npm --version');
  if (!version) {
    log(FAIL, 'npm not found');
    hasErrors = true;
    return;
  }

  const major = parseInt(version.split('.')[0]);
  if (major >= 9) {
    log(PASS, `npm ${version}`, '>= 9 required');
  } else {
    log(WARN, `npm ${version}`, '>= 9 recommended');
    hasWarnings = true;
  }
}

function checkGit() {
  const version = getVersion('git --version');
  if (!version) {
    log(WARN, 'Git not found', 'Optional but recommended');
    hasWarnings = true;
    return;
  }
  log(PASS, version);
}

function checkEnvFile() {
  section('Environment');

  // Check for .env.local in current directory or example/convex
  const locations = [
    '.env.local',
    'example/convex/.env.local',
    '../.env.local',
  ];

  let envPath = null;
  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      envPath = loc;
      break;
    }
  }

  if (!envPath) {
    log(FAIL, '.env.local not found');
    log(INFO, 'Create from template:', 'cp .env.example .env.local');
    hasErrors = true;
    return null;
  }

  log(PASS, `.env.local found`, envPath);
  return envPath;
}

function checkEnvVars(envPath) {
  if (!envPath) return;

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');

  const vars = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        vars[key] = value;
      }
    }
  }

  // Required vars
  const required = ['CONVEX_URL', 'OPENROUTER_KEY', 'GEMINI_API_KEY'];
  for (const key of required) {
    if (vars[key] && vars[key] !== 'your_key_here' && vars[key] !== '') {
      // Mask the value
      const masked = vars[key].substring(0, 8) + '...';
      log(PASS, key, masked);
    } else {
      log(FAIL, key, 'Not set or placeholder');
      hasErrors = true;
    }
  }

  // Optional vars (info only)
  const optional = ['TICK_TOKEN', 'WRITE_TOKEN', 'LLM_PROVIDER', 'MODEL_ID'];
  for (const key of optional) {
    if (vars[key]) {
      log(INFO, key, 'Set');
    }
  }
}

function checkDependencies() {
  section('Dependencies');

  const locations = [
    'node_modules',
    'example/convex/node_modules',
  ];

  let found = false;
  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      const count = fs.readdirSync(loc).length;
      log(PASS, `node_modules found`, `${count} packages`);
      found = true;
      break;
    }
  }

  if (!found) {
    log(FAIL, 'node_modules not found');
    log(INFO, 'Run:', 'npm install');
    hasErrors = true;
  }
}

function checkPorts() {
  section('Network');

  const ports = [3001];

  for (const port of ports) {
    try {
      // Try to check if port is in use (cross-platform)
      if (process.platform === 'win32') {
        execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
        log(WARN, `Port ${port} in use`, 'May conflict with Convex dev server');
        hasWarnings = true;
      } else {
        execSync(`lsof -i :${port}`, { stdio: 'pipe' });
        log(WARN, `Port ${port} in use`, 'May conflict with Convex dev server');
        hasWarnings = true;
      }
    } catch {
      log(PASS, `Port ${port} available`);
    }
  }
}

function checkConvex() {
  section('Convex');

  const version = getVersion('npx convex --version');
  if (version) {
    log(PASS, `Convex CLI`, version);
  } else {
    log(INFO, 'Convex CLI not installed globally', 'Will use npx');
  }

  // Check for convex directory
  const locations = ['convex', 'example/convex/convex'];
  let found = false;
  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      log(PASS, 'Convex directory found', loc);
      found = true;
      break;
    }
  }

  if (!found) {
    log(WARN, 'Convex directory not found', 'May need npx convex init');
    hasWarnings = true;
  }
}

function checkTests() {
  section('Tests');

  const locations = ['tests', 'example/convex/tests'];
  let found = false;
  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      const files = fs.readdirSync(loc, { recursive: true })
        .filter(f => f.endsWith('.test.ts'));
      log(PASS, `Test files found`, `${files.length} test files`);
      found = true;
      break;
    }
  }

  if (!found) {
    log(INFO, 'Test directory not found');
  }
}

function printSummary() {
  console.log('\n' + '═'.repeat(50));

  if (hasErrors) {
    console.log(`${colors.red}ERRORS FOUND${colors.reset} - Fix the issues above before running.`);
    console.log(`\nQuick fixes:`);
    console.log(`  1. npm install`);
    console.log(`  2. cp .env.example .env.local`);
    console.log(`  3. Edit .env.local with your API keys`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`${colors.yellow}WARNINGS${colors.reset} - Ready to run with minor issues.`);
    console.log(`\nRun: npm run dev`);
    console.log(`Or:  npm run demo  (no API keys needed)`);
    process.exit(0);
  } else {
    console.log(`${colors.green}ALL CHECKS PASSED${colors.reset}`);
    console.log(`\nRun: npm run dev`);
    process.exit(0);
  }
}

// Main
console.log(`\n${colors.blue}ClarkOS Doctor${colors.reset}`);
console.log('Checking your environment...');

checkNodeVersion();
checkNpm();
checkGit();
const envPath = checkEnvFile();
checkEnvVars(envPath);
checkDependencies();
checkPorts();
checkConvex();
checkTests();
printSummary();
