#!/usr/bin/env node

/**
 * 🔒 SECURITY MONITORING
 * $698B+ IZA OS Enterprise Ecosystem
 * Version: 2.0.0
 * Last Updated: 2024-12-26
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const ECOSYSTEM_ROOT = process.env.ECOSYSTEM_ROOT || '/Users/divinejohns/memU';
const SECURITY_LOG = path.join(ECOSYSTEM_ROOT, 'security-monitor.log');

// Security monitoring functions
function checkFileIntegrity() {
    const criticalFiles = [
        'docker-compose.yml',
        '_MCP_INTEGRATION_HUB/configurations/warp-integration.json',
        '_MCP_INTEGRATION_HUB/configurations/unified-ecosystem.yaml'
    ];
    
    const checksums = {};
    
    criticalFiles.forEach(file => {
        const filePath = path.join(ECOSYSTEM_ROOT, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath);
            checksums[file] = crypto.createHash('sha256').update(content).digest('hex');
        }
    });
    
    return checksums;
}

function checkPermissions() {
    const criticalFiles = [
        '.env',
        '.env.local',
        'docker-compose.yml'
    ];
    
    const permissionIssues = [];
    
    criticalFiles.forEach(file => {
        const filePath = path.join(ECOSYSTEM_ROOT, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const mode = stats.mode & parseInt('777', 8);
            
            // Check if file is world-readable
            if (mode & 4) {
                permissionIssues.push(`${file} is world-readable`);
            }
        }
    });
    
    return permissionIssues;
}

function generateSecurityReport() {
    const timestamp = new Date().toISOString();
    const fileIntegrity = checkFileIntegrity();
    const permissionIssues = checkPermissions();
    
    const report = {
        timestamp: timestamp,
        ecosystem_value: '$698B+',
        file_integrity: fileIntegrity,
        permission_issues: permissionIssues,
        security_status: permissionIssues.length === 0 ? 'SECURE' : 'NEEDS_ATTENTION'
    };
    
    // Save report
    const reportFile = path.join(ECOSYSTEM_ROOT, '_MCP_INTEGRATION_HUB/monitoring/security-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return report;
}

// Run security monitoring
if (require.main === module) {
    const report = generateSecurityReport();
    console.log(`Security Report: ${report.security_status}`);
    if (report.permission_issues.length > 0) {
        console.log('Permission Issues:', report.permission_issues);
    }
}

module.exports = {
    checkFileIntegrity,
    checkPermissions,
    generateSecurityReport
};
