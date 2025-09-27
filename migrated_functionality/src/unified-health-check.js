#!/usr/bin/env node

/**
 * 🏥 UNIFIED ECOSYSTEM HEALTH CHECK
 * $698B+ IZA OS Enterprise Ecosystem
 * Version: 2.0.0
 * Last Updated: 2024-12-26
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ECOSYSTEM_ROOT = process.env.ECOSYSTEM_ROOT || '/Users/divinejohns/memU';
const CONFIG_FILE = path.join(ECOSYSTEM_ROOT, '_MCP_INTEGRATION_HUB/configurations/unified-ecosystem.yaml');
const LOG_FILE = path.join(ECOSYSTEM_ROOT, 'health-check.log');

// Service definitions (aligned with $698B assessment)
const SERVICES = {
    // Core Infrastructure Services
    'api-gateway': { port: 8080, health: '/health', value: '$50B+' },
    'memu-dashboard': { port: 3004, health: '/health', value: '$25B+' },
    'backend-core': { port: 3000, health: '/health', value: '$40B+' },
    
    // Data Services
    'postgres': { port: 5432, health: '', value: '$15B+' },
    'redis': { port: 6379, health: '', value: '$10B+' },
    
    // AI Services
    'ollama-ai': { port: 11434, health: '/api/tags', value: '$30B+' },
    'omnara-mcp': { port: 8080, health: '/health', value: '$35B+' },
    
    // Automation Services
    'n8n-workflows': { port: 5679, health: '/health', value: '$45B+' },
    
    // Financial Services
    'quant-finance': { port: 8086, health: '/health', value: '$40B+' },
    
    // Monitoring Services
    'prometheus': { port: 9090, health: '/health', value: '$5B+' },
    'grafana': { port: 3001, health: '/health', value: '$8B+' },
    'jaeger': { port: 16686, health: '/health', value: '$3B+' },
    
    // Enterprise Services
    'business-intelligence': { port: 3011, health: '/health', value: '$25B+' },
    'autonomous-system': { port: 3012, health: '/health', value: '$50B+' },
    'security-system': { port: 3013, health: '/health', value: '$20B+' },
    'devops-system': { port: 3014, health: '/health', value: '$15B+' },
    'integration-system': { port: 3015, health: '/health', value: '$30B+' },
    'frontend-system': { port: 3016, health: '/health', value: '$20B+' }
};

// MCP Services (aligned with $698B assessment)
const MCP_SERVICES = {
    'ecosystem-mcp-server': { port: 8000, health: '/health', value: '$15B+' },
    'claude-chat-analyzer': { port: 8001, health: '/health', value: '$10B+' },
    'project-executor': { port: 8002, health: '/health', value: '$12B+' },
    'business-monetizer': { port: 8003, health: '/health', value: '$8B+' }
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Logging functions
function log(message, color = colors.white) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`${color}${logMessage}${colors.reset}`);
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

// Function to check if port is listening
function checkPort(port) {
    return new Promise((resolve) => {
        import('net').then(({ default: net }) => {
        const socket = new net.Socket();
        
        socket.setTimeout(1000);
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        
            socket.connect(port, 'localhost');
        });
    });
}

// Function to make HTTP health check
function httpHealthCheck(port, healthPath) {
    return new Promise((resolve) => {
        const url = `http://localhost:${port}${healthPath}`;
        
        const req = http.get(url, { timeout: 5000 }, (res) => {
            if (res.statusCode === 200) {
                resolve({ healthy: true, status: res.statusCode });
            } else {
                resolve({ healthy: false, status: res.statusCode });
            }
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({ healthy: false, status: 'timeout' });
        });
        
        req.on('error', (err) => {
            resolve({ healthy: false, status: err.message });
        });
    });
}

// Function to check service health
async function checkServiceHealth(serviceName, serviceConfig) {
    const { port, health, value } = serviceConfig;
    
    try {
        // First check if port is listening
        const portListening = await checkPort(port);
        
        if (!portListening) {
            return {
                service: serviceName,
                healthy: false,
                status: 'port_not_listening',
                value: value,
                port: port
            };
        }
        
        // If no health endpoint, just check port
        if (!health) {
            return {
                service: serviceName,
                healthy: true,
                status: 'port_listening',
                value: value,
                port: port
            };
        }
        
        // Perform HTTP health check
        const healthResult = await httpHealthCheck(port, health);
        
        return {
            service: serviceName,
            healthy: healthResult.healthy,
            status: healthResult.status,
            value: value,
            port: port
        };
        
    } catch (error) {
        return {
            service: serviceName,
            healthy: false,
            status: error.message,
            value: value,
            port: port
        };
    }
}

// Function to check all services
async function checkAllServices() {
    logInfo('🏥 Starting comprehensive health check for $698B ecosystem...');
    
    const results = [];
    let healthyCount = 0;
    let totalCount = 0;
    
    // Check Docker services
    logInfo('🔍 Checking Docker services...');
    for (const [serviceName, serviceConfig] of Object.entries(SERVICES)) {
        totalCount++;
        const result = await checkServiceHealth(serviceName, serviceConfig);
        results.push(result);
        
        if (result.healthy) {
            healthyCount++;
            logSuccess(`${serviceName} (${result.port}) - ${result.status} - ${result.value}`);
        } else {
            logError(`${serviceName} (${result.port}) - ${result.status} - ${result.value}`);
        }
    }
    
    // Check MCP services
    logInfo('🔗 Checking MCP services...');
    for (const [serviceName, serviceConfig] of Object.entries(MCP_SERVICES)) {
        totalCount++;
        const result = await checkServiceHealth(serviceName, serviceConfig);
        results.push(result);
        
        if (result.healthy) {
            healthyCount++;
            logSuccess(`${serviceName} (${result.port}) - ${result.status} - ${result.value}`);
        } else {
            logError(`${serviceName} (${result.port}) - ${result.status} - ${result.value}`);
        }
    }
    
    return { results, healthyCount, totalCount };
}

// Function to generate health report
function generateHealthReport(results, healthyCount, totalCount) {
    const healthPercentage = Math.round((healthyCount / totalCount) * 100);
    const timestamp = new Date().toISOString();
    
    const report = {
        timestamp: timestamp,
        ecosystem_value: '$698B+',
        total_services: totalCount,
        healthy_services: healthyCount,
        unhealthy_services: totalCount - healthyCount,
        health_percentage: healthPercentage,
        services: results,
        status: healthPercentage === 100 ? 'FULLY_OPERATIONAL' : 
                healthPercentage >= 90 ? 'MOSTLY_OPERATIONAL' : 
                healthPercentage >= 70 ? 'PARTIALLY_OPERATIONAL' : 'NEEDS_ATTENTION'
    };
    
    return report;
}

// Function to save health report
function saveHealthReport(report) {
    const reportFile = path.join(ECOSYSTEM_ROOT, '_MCP_INTEGRATION_HUB/monitoring/health-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Also save timestamped report
    const timestampedReportFile = path.join(ECOSYSTEM_ROOT, `_MCP_INTEGRATION_HUB/monitoring/health-report-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(timestampedReportFile, JSON.stringify(report, null, 2));
}

// Function to display summary
function displaySummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.magenta}🏥 ECOSYSTEM HEALTH REPORT${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`${colors.cyan}💰 Ecosystem Value:${colors.reset} ${report.ecosystem_value}`);
    console.log(`${colors.cyan}📅 Timestamp:${colors.reset} ${report.timestamp}`);
    console.log(`${colors.cyan}🏗️  Total Services:${colors.reset} ${report.total_services}`);
    console.log(`${colors.cyan}✅ Healthy Services:${colors.reset} ${report.healthy_services}`);
    console.log(`${colors.cyan}❌ Unhealthy Services:${colors.reset} ${report.unhealthy_services}`);
    console.log(`${colors.cyan}📊 Health Percentage:${colors.reset} ${report.health_percentage}%`);
    console.log(`${colors.cyan}🎯 Status:${colors.reset} ${report.status}`);
    
    // Status-specific message
    switch (report.status) {
        case 'FULLY_OPERATIONAL':
            console.log(`\n${colors.green}🎉 ALL SERVICES HEALTHY - $698B ECOSYSTEM FULLY OPERATIONAL!${colors.reset}`);
            break;
        case 'MOSTLY_OPERATIONAL':
            console.log(`\n${colors.yellow}⚠️  MOST SERVICES HEALTHY - $698B ECOSYSTEM MOSTLY OPERATIONAL${colors.reset}`);
            break;
        case 'PARTIALLY_OPERATIONAL':
            console.log(`\n${colors.yellow}🔧 SOME SERVICES NEED ATTENTION - $698B ECOSYSTEM PARTIALLY OPERATIONAL${colors.reset}`);
            break;
        case 'NEEDS_ATTENTION':
            console.log(`\n${colors.red}❌ MULTIPLE SERVICES NEED ATTENTION - $698B ECOSYSTEM NEEDS ATTENTION${colors.reset}`);
            break;
    }
    
    console.log('\n' + '='.repeat(60));
}

// Main function
async function main() {
    try {
        logInfo('🚀 Starting $698B Ecosystem Health Check');
        
        // Perform health checks
        const { results, healthyCount, totalCount } = await checkAllServices();
        
        // Generate and save report
        const report = generateHealthReport(results, healthyCount, totalCount);
        saveHealthReport(report);
        
        // Display summary
        displaySummary(report);
        
        // Exit with appropriate code
        if (report.status === 'FULLY_OPERATIONAL') {
            process.exit(0);
        } else if (report.status === 'MOSTLY_OPERATIONAL') {
            process.exit(0);
        } else {
            process.exit(1);
        }
        
    } catch (error) {
        logError(`Health check failed: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export {
    checkAllServices,
    generateHealthReport,
    saveHealthReport,
    displaySummary
};
