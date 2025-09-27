#!/usr/bin/env node

/**
 * 🧪 INTEGRATION TESTING & VALIDATION SYSTEM
 * 
 * Comprehensive testing of ecosystem integration and functionality
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class IntegrationTester {
    constructor() {
        this.ecosystemRoot = process.env.ECOSYSTEM_ROOT || "/Users/divinejohns/memU";
        this.testResults = {
            timestamp: new Date().toISOString(),
            overall_status: "unknown",
            tests: [],
            summary: {},
            issues: []
        };
    }

    async runTest(testName, testFunction) {
        console.log(`🧪 Running test: ${testName}`);
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.testResults.tests.push({
                name: testName,
                status: result ? "passed" : "failed",
                duration: duration,
                details: result.details || "Test completed",
                timestamp: new Date().toISOString()
            });
            
            console.log(result ? "✅" : "❌", `${testName} (${duration}ms)`);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.testResults.tests.push({
                name: testName,
                status: "error", 
                duration: duration,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            console.log("💥", `${testName} FAILED: ${error.message} (${duration}ms)`);
            return false;
        }
    }

    async testEcosystemStructure() {
        const requiredDirs = [
            "_BILLIONAIRE_CONSCIOUSNESS_EMPIRE",
            "_IZA_ENTERPRISE_PLATFORM", 
            "_AI_AGENT_ECOSYSTEM",
            "_MCP_INTEGRATION_HUB",
            "_DEVELOPMENT_TOOLS",
            "_AUTOMATION_PLATFORMS"
        ];

        for (const dir of requiredDirs) {
            const dirPath = path.join(this.ecosystemRoot, dir);
            try {
                await fs.access(dirPath);
            } catch {
                throw new Error(`Required directory missing: ${dir}`);
            }
        }

        return { success: true, details: "All required directories exist" };
    }

    async testMCPServerConnectivity() {
        const serverPath = path.join(this.ecosystemRoot, "_MCP_INTEGRATION_HUB/servers/ecosystem-mcp-server");
        
        try {
            await fs.access(path.join(serverPath, "server.js"));
            await fs.access(path.join(serverPath, "package.json"));
            
            // Test if dependencies are installed
            const nodeModulesPath = path.join(serverPath, "node_modules");
            await fs.access(nodeModulesPath);
            
            return { success: true, details: "MCP server files and dependencies available" };
        } catch (error) {
            throw new Error(`MCP server connectivity test failed: ${error.message}`);
        }
    }

    async testWarpConfiguration() {
        const warpConfigPath = path.join(process.env.HOME, ".warp/claude_mcp_config.json");
        
        try {
            await fs.access(warpConfigPath);
            const configContent = await fs.readFile(warpConfigPath, 'utf8');
            const config = JSON.parse(configContent);
            
            if (!config.mcpServers || !config.mcpServers["memU-ecosystem"]) {
                throw new Error("Warp MCP configuration missing memU-ecosystem server");
            }
            
            return { success: true, details: "Warp configuration valid" };
        } catch (error) {
            throw new Error(`Warp configuration test failed: ${error.message}`);
        }
    }

    async testTerminalProfiles() {
        const profilesDir = path.join(this.ecosystemRoot, "_MCP_INTEGRATION_HUB/warp-connections/terminal-profiles");
        const requiredProfiles = [
            "consciousness-profile.json",
            "enterprise-profile.json", 
            "agents-profile.json",
            "mcp-profile.json"
        ];

        for (const profile of requiredProfiles) {
            const profilePath = path.join(profilesDir, profile);
            try {
                await fs.access(profilePath);
                const content = await fs.readFile(profilePath, 'utf8');
                JSON.parse(content); // Validate JSON
            } catch (error) {
                throw new Error(`Profile ${profile} invalid: ${error.message}`);
            }
        }

        return { success: true, details: "All terminal profiles valid" };
    }

    async testHealthMonitoring() {
        const monitoringScript = path.join(this.ecosystemRoot, "_MCP_INTEGRATION_HUB/monitoring/health-check.cjs");
        
        try {
            await fs.access(monitoringScript);
            
            // Test if health check runs without crashing
            execSync(`node "${monitoringScript}"`, { 
                timeout: 10000,
                stdio: 'pipe'
            });
            
            return { success: true, details: "Health monitoring system operational" };
        } catch (error) {
            throw new Error(`Health monitoring test failed: ${error.message}`);
        }
    }

    async testClaudeCliIntegration() {
        try {
            const result = execSync('which claude', { encoding: 'utf8' });
            if (!result.trim()) {
                throw new Error("Claude CLI not found");
            }
            
            return { success: true, details: "Claude CLI available" };
        } catch (error) {
            throw new Error(`Claude CLI integration test failed: ${error.message}`);
        }
    }

    async testEcosystemPermissions() {
        const testDirs = [
            "_MCP_INTEGRATION_HUB/servers",
            "_MCP_INTEGRATION_HUB/configurations",
            "_BILLIONAIRE_CONSCIOUSNESS_EMPIRE",
            "_IZA_ENTERPRISE_PLATFORM"
        ];

        for (const dir of testDirs) {
            const dirPath = path.join(this.ecosystemRoot, dir);
            try {
                await fs.access(dirPath, fs.constants.R_OK | fs.constants.W_OK);
            } catch (error) {
                throw new Error(`Permission denied for directory: ${dir}`);
            }
        }

        return { success: true, details: "All directories have proper permissions" };
    }

    async testPerformanceMetrics() {
        const startTime = Date.now();
        
        // Test file system performance
        const testFile = path.join(this.ecosystemRoot, "_MCP_INTEGRATION_HUB/.test_performance");
        const testData = "performance test data";
        
        await fs.writeFile(testFile, testData);
        const readData = await fs.readFile(testFile, 'utf8');
        await fs.unlink(testFile);
        
        const duration = Date.now() - startTime;
        
        if (readData !== testData) {
            throw new Error("File system integrity test failed");
        }
        
        if (duration > 1000) {
            throw new Error(`File system performance slow: ${duration}ms`);
        }

        return { success: true, details: `File system performance: ${duration}ms` };
    }

    calculateOverallStatus() {
        const tests = this.testResults.tests;
        const total = tests.length;
        const passed = tests.filter(t => t.status === "passed").length;
        const failed = tests.filter(t => t.status === "failed").length;
        const errored = tests.filter(t => t.status === "error").length;

        this.testResults.summary = {
            total_tests: total,
            passed: passed,
            failed: failed,
            errored: errored,
            success_rate: total > 0 ? Math.round((passed / total) * 100) : 0
        };

        if (passed === total && total > 0) {
            this.testResults.overall_status = "all_passed";
        } else if (failed === 0 && errored === 0 && total > 0) {
            this.testResults.overall_status = "partial";
        } else if (total === 0) {
            this.testResults.overall_status = "no_tests";
        } else {
            this.testResults.overall_status = "failures_detected";
        }
    }

    async runAllTests() {
        console.log("🚀 Starting Ecosystem Integration Testing");
        console.log("=" * 60);

        // Run all integration tests
        await this.runTest("Ecosystem Structure", () => this.testEcosystemStructure());
        await this.runTest("MCP Server Connectivity", () => this.testMCPServerConnectivity()); 
        await this.runTest("Warp Configuration", () => this.testWarpConfiguration());
        await this.runTest("Terminal Profiles", () => this.testTerminalProfiles());
        await this.runTest("Health Monitoring", () => this.testHealthMonitoring());
        await this.runTest("Claude CLI Integration", () => this.testClaudeCliIntegration());
        await this.runTest("Ecosystem Permissions", () => this.testEcosystemPermissions());
        await this.runTest("Performance Metrics", () => this.testPerformanceMetrics());

        // Calculate overall status
        this.calculateOverallStatus();

        // Display results
        this.displayResults();

        // Save test report
        await this.saveTestReport();

        return this.testResults;
    }

    displayResults() {
        console.log("\n" + "=".repeat(60));
        console.log("🧪 INTEGRATION TEST RESULTS");
        console.log("=".repeat(60));

        const statusIcon = {
            "all_passed": "✅",
            "partial": "⚠️ ",
            "failures_detected": "❌",
            "no_tests": "📭"
        };

        console.log(`\n${statusIcon[this.testResults.overall_status]} Overall Status: ${this.testResults.overall_status.toUpperCase()}`);
        console.log(`📊 Success Rate: ${this.testResults.summary.success_rate}%`);

        console.log("\n📈 TEST SUMMARY:");
        console.log(`   Total Tests: ${this.testResults.summary.total_tests}`);
        console.log(`   ✅ Passed: ${this.testResults.summary.passed}`);
        console.log(`   ❌ Failed: ${this.testResults.summary.failed}`);
        console.log(`   💥 Errored: ${this.testResults.summary.errored}`);

        console.log("\n🔍 DETAILED RESULTS:");
        for (const test of this.testResults.tests) {
            const icon = {
                "passed": "✅",
                "failed": "❌", 
                "error": "💥"
            };
            
            console.log(`   ${icon[test.status]} ${test.name}: ${test.status.toUpperCase()} (${test.duration}ms)`);
            if (test.details) {
                console.log(`      ${test.details}`);
            }
            if (test.error) {
                console.log(`      Error: ${test.error}`);
            }
        }

        console.log("\n" + "=".repeat(60));
        console.log(`Integration testing completed: ${new Date().toISOString()}`);
        console.log("=".repeat(60) + "\n");
    }

    async saveTestReport() {
        const reportPath = path.join(this.ecosystemRoot, "_MCP_INTEGRATION_HUB/monitoring/integration-test-report.json");
        await fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2));

        const timestamp = new Date().toISOString().split('T')[0];
        const timestampedPath = path.join(this.ecosystemRoot, "_MCP_INTEGRATION_HUB/monitoring", `integration-test-${timestamp}.json`);
        await fs.writeFile(timestampedPath, JSON.stringify(this.testResults, null, 2));

        console.log(`📝 Test report saved: ${reportPath}`);
    }
}

// Run integration tests if called directly
if (require.main === module) {
    const tester = new IntegrationTester();
    tester.runAllTests().catch(console.error);
}

module.exports = IntegrationTester;