#!/usr/bin/env node

/**
 * 📅 DAILY ECOSYSTEM HEALTH CHECK
 * $698B+ IZA OS Enterprise Ecosystem
 * Version: 2.0.0
 * Last Updated: 2024-12-26
 * 
 * Scheduled daily health check with comprehensive reporting
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Configuration
const ECOSYSTEM_ROOT = process.env.ECOSYSTEM_ROOT || '/Users/divinejohns/memU';
const LOG_FILE = path.join(ECOSYSTEM_ROOT, 'daily-health-check.log');
const REPORT_DIR = path.join(ECOSYSTEM_ROOT, '_MCP_INTEGRATION_HUB/monitoring/reports');

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

// Function to run unified health check
function runHealthCheck() {
    return new Promise((resolve, reject) => {
        const healthCheckScript = path.join(ECOSYSTEM_ROOT, '_MCP_INTEGRATION_HUB/monitoring/unified-health-check.js');
        
        exec(`node "${healthCheckScript}"`, (error, stdout, stderr) => {
            if (error) {
                logError(`Health check execution failed: ${error.message}`);
                reject(error);
                return;
            }
            
            if (stderr) {
                logWarning(`Health check warnings: ${stderr}`);
            }
            
            logInfo(`Health check output:\n${stdout}`);
            resolve(stdout);
        });
    });
}

// Function to get system resource usage
function getSystemResources() {
    return new Promise((resolve) => {
        exec('top -l 1 -n 0 | head -20', (error, stdout) => {
            if (error) {
                logError(`Failed to get system resources: ${error.message}`);
                resolve({ error: error.message });
                return;
            }
            
            // Parse system information
            const lines = stdout.split('\n');
            const loadAvg = lines[1]?.split(' ')[3] || 'unknown';
            const cpuUsage = lines[3]?.split(' ')[2] || 'unknown';
            const memoryInfo = lines[6] || 'unknown';
            
            resolve({
                load_average: loadAvg,
                cpu_usage: cpuUsage,
                memory_info: memoryInfo,
                timestamp: new Date().toISOString()
            });
        });
    });
}

// Function to get disk usage
function getDiskUsage() {
    return new Promise((resolve) => {
        exec(`df -h "${ECOSYSTEM_ROOT}"`, (error, stdout) => {
            if (error) {
                logError(`Failed to get disk usage: ${error.message}`);
                resolve({ error: error.message });
                return;
            }
            
            const lines = stdout.split('\n');
            const diskInfo = lines[1]?.split(/\s+/) || [];
            
            resolve({
                filesystem: diskInfo[0] || 'unknown',
                size: diskInfo[1] || 'unknown',
                used: diskInfo[2] || 'unknown',
                available: diskInfo[3] || 'unknown',
                usage_percent: diskInfo[4] || 'unknown',
                mount_point: diskInfo[5] || 'unknown',
                timestamp: new Date().toISOString()
            });
        });
    });
}

// Function to get Docker status
function getDockerStatus() {
    return new Promise((resolve) => {
        exec('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', (error, stdout) => {
            if (error) {
                logError(`Failed to get Docker status: ${error.message}`);
                resolve({ error: error.message });
                return;
            }
            
            const containers = [];
            const lines = stdout.split('\n').slice(1); // Skip header
            
            lines.forEach(line => {
                if (line.trim()) {
                    const parts = line.split('\t');
                    if (parts.length >= 3) {
                        containers.push({
                            name: parts[0],
                            status: parts[1],
                            ports: parts[2],
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            });
            
            resolve({
                containers: containers,
                total_containers: containers.length,
                timestamp: new Date().toISOString()
            });
        });
    });
}

// Function to generate daily report
async function generateDailyReport() {
    const reportDate = new Date().toISOString().split('T')[0];
    const reportFile = path.join(REPORT_DIR, `daily-report-${reportDate}.json`);
    
    logInfo(`📊 Generating daily report for ${reportDate}...`);
    
    try {
        // Ensure report directory exists
        if (!fs.existsSync(REPORT_DIR)) {
            fs.mkdirSync(REPORT_DIR, { recursive: true });
        }
        
        // Collect all data
        const [systemResources, diskUsage, dockerStatus] = await Promise.all([
            getSystemResources(),
            getDiskUsage(),
            getDockerStatus()
        ]);
        
        // Generate report
        const report = {
            report_date: reportDate,
            timestamp: new Date().toISOString(),
            ecosystem_value: '$698B+',
            system_resources: systemResources,
            disk_usage: diskUsage,
            docker_status: dockerStatus,
            summary: {
                total_containers: dockerStatus.total_containers || 0,
                system_load: systemResources.load_average || 'unknown',
                disk_usage_percent: diskUsage.usage_percent || 'unknown',
                report_generated: true
            }
        };
        
        // Save report
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        logSuccess(`Daily report saved: ${reportFile}`);
        
        return report;
        
    } catch (error) {
        logError(`Failed to generate daily report: ${error.message}`);
        throw error;
    }
}

// Function to send daily summary
function sendDailySummary(report) {
    logInfo('📧 Sending daily summary...');
    
    const summary = `
🏥 DAILY ECOSYSTEM HEALTH SUMMARY
================================
📅 Date: ${report.report_date}
💰 Ecosystem Value: ${report.ecosystem_value}
🏗️  Total Containers: ${report.summary.total_containers}
📊 System Load: ${report.summary.system_load}
💾 Disk Usage: ${report.summary.disk_usage_percent}
⏰ Report Generated: ${report.timestamp}

🔍 For detailed health check, run:
   node ${ECOSYSTEM_ROOT}/_MCP_INTEGRATION_HUB/monitoring/unified-health-check.js

📈 For deployment status, run:
   ${ECOSYSTEM_ROOT}/deploy/unified-deployment.sh
`;
    
    logInfo(`Daily Summary:\n${summary}`);
    
    // Here you could add email/Slack/Teams notification logic
    // For now, we'll just log it
}

// Main daily health check function
async function runDailyHealthCheck() {
    logInfo('🌅 Starting daily health check for $698B ecosystem...');
    
    try {
        // Run comprehensive health check
        logInfo('🔍 Running comprehensive health check...');
        await runHealthCheck();
        
        // Generate daily report
        logInfo('📊 Generating daily report...');
        const report = await generateDailyReport();
        
        // Send daily summary
        logInfo('📧 Preparing daily summary...');
        sendDailySummary(report);
        
        logSuccess('✅ Daily health check completed successfully');
        
    } catch (error) {
        logError(`❌ Daily health check failed: ${error.message}`);
        throw error;
    }
}

// Schedule daily health check (runs at 9:00 AM every day)
function scheduleDailyHealthCheck() {
    logInfo('⏰ Scheduling daily health check at 9:00 AM...');
    
    cron.schedule('0 9 * * *', () => {
        logInfo('🕘 Scheduled daily health check triggered');
        runDailyHealthCheck().catch(error => {
            logError(`Scheduled health check failed: ${error.message}`);
        });
    }, {
        scheduled: true,
        timezone: "America/New_York"
    });
    
    logSuccess('✅ Daily health check scheduled successfully');
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--schedule')) {
        // Run in scheduling mode
        logInfo('🔄 Starting health check scheduler...');
        scheduleDailyHealthCheck();
        
        // Keep the process running
        process.on('SIGINT', () => {
            logInfo('👋 Health check scheduler shutting down...');
            process.exit(0);
        });
        
    } else if (args.includes('--report-only')) {
        // Generate report only
        logInfo('📊 Generating daily report only...');
        const report = await generateDailyReport();
        sendDailySummary(report);
        
    } else {
        // Run immediate health check
        await runDailyHealthCheck();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        logError(`Daily health check failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    runDailyHealthCheck,
    generateDailyReport,
    scheduleDailyHealthCheck,
    getSystemResources,
    getDiskUsage,
    getDockerStatus
};
