#!/usr/bin/env node

/**
 * Cross-platform setup verification script
 * Ensures the project can run consistently across different operating systems
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const requiredFiles = [
  'package.json',
  'src/index.js',
  'public/index.html',
  '.env.example'
];

const requiredDependencies = [
  'react',
  '@mui/material',
  'react-chartjs-2',
  'chart.js'
];

function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing required file: ${filePath}`);
    return false;
  }
  console.log(`✅ Found: ${filePath}`);
  return true;
}

function checkNodeVersion() {
  try {
    const version = process.version;
    const majorVersion = parseInt(version.split('.')[0].substring(1));

    if (majorVersion < 16) {
      console.error(`❌ Node.js version ${version} is too old. Please install Node.js 16 or higher.`);
      return false;
    }

    console.log(`✅ Node.js version: ${version}`);
    return true;
  } catch (error) {
    console.error('❌ Could not determine Node.js version');
    return false;
  }
}

function checkNpmVersion() {
  try {
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(version.split('.')[0]);

    if (majorVersion < 8) {
      console.error(`❌ npm version ${version} is too old. Please update npm.`);
      return false;
    }

    console.log(`✅ npm version: ${version}`);
    return true;
  } catch (error) {
    console.error('❌ Could not determine npm version');
    return false;
  }
}

function checkDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  let allDepsFound = true;
  requiredDependencies.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ Dependency: ${dep} (${dependencies[dep]})`);
    } else {
      console.error(`❌ Missing dependency: ${dep}`);
      allDepsFound = false;
    }
  });

  return allDepsFound;
}

function checkEnvironment() {
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envLocalPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ .env.example file not found');
    return false;
  }

  if (!fs.existsSync(envLocalPath)) {
    console.warn('⚠️  .env.local file not found. Please create one based on .env.example');
    return false;
  }

  console.log('✅ Environment files configured');
  return true;
}

function checkGitConfig() {
  try {
    const platform = process.platform;
    console.log(`✅ Platform: ${platform}`);

    if (fs.existsSync('.git')) {
      console.log('✅ Git repository detected');
    } else {
      console.warn('⚠️  Not a git repository');
    }

    return true;
  } catch (error) {
    console.error('❌ Could not check git configuration');
    return false;
  }
}

function main() {
  console.log('🔍 IoTFlow Dashboard - Cross-Platform Setup Verification\n');

  let allChecksPass = true;

  // Check Node.js and npm versions
  allChecksPass = checkNodeVersion() && allChecksPass;
  allChecksPass = checkNpmVersion() && allChecksPass;

  console.log('\n📁 Checking required files...');
  requiredFiles.forEach(file => {
    allChecksPass = checkFile(file) && allChecksPass;
  });

  console.log('\n📦 Checking dependencies...');
  allChecksPass = checkDependencies() && allChecksPass;

  console.log('\n🔐 Checking environment...');
  checkEnvironment(); // Don't fail on missing .env.local

  console.log('\n🔧 Checking git configuration...');
  checkGitConfig();

  console.log('\n' + '='.repeat(50));

  if (allChecksPass) {
    console.log('🎉 All checks passed! Your environment is ready for development.');
    console.log('\nNext steps:');
    console.log('1. Run: npm install (if not already done)');
    console.log('2. Copy .env.example to .env.local and configure');
    console.log('3. Run: npm start');
  } else {
    console.log('❌ Some checks failed. Please resolve the issues above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, checkNodeVersion, checkNpmVersion, checkDependencies };
