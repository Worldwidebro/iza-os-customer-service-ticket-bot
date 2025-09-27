/**
 * MEMU Ecosystem Analysis Service
 * Comprehensive file and folder analysis for IZA OS alignment
 * Powered by Ollama for intelligent code analysis
 */

import { ollamaService } from './ollamaService';
import fs from 'fs';
import path from 'path';

export interface FileAnalysis {
  filePath: string;
  fileType: string;
  size: number;
  lastModified: Date;
  analysis: {
    purpose: string;
    integrationPoints: string[];
    alignmentIssues: string[];
    optimizationSuggestions: string[];
    complianceStatus: string;
  };
}

export interface EcosystemAnalysis {
  totalFiles: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  integrationScore: number;
  alignmentIssues: string[];
  optimizationOpportunities: string[];
  complianceGaps: string[];
  recommendations: string[];
}

export interface RepositoryAlignment {
  repository: string;
  alignmentScore: number;
  missingComponents: string[];
  duplicateComponents: string[];
  integrationPoints: string[];
  recommendations: string[];
}

class MEMUEcosystemAnalyzer {
  private basePath: string;
  private analysisResults: FileAnalysis[] = [];

  constructor(basePath: string = '/Users/divinejohns/memU') {
    this.basePath = basePath;
  }

  /**
   * Analyze entire MEMU ecosystem structure
   */
  async analyzeEcosystem(): Promise<EcosystemAnalysis> {
    console.log('🔍 Starting comprehensive MEMU ecosystem analysis...');
    
    const files = this.getAllFiles();
    const analysisResults: FileAnalysis[] = [];

    // Analyze each file with Ollama
    for (const file of files.slice(0, 10)) { // Start with first 10 files for demo
      try {
        const analysis = await this.analyzeFile(file);
        analysisResults.push(analysis);
        console.log(`✅ Analyzed: ${file}`);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${file}:`, error);
      }
    }

    this.analysisResults = analysisResults;
    return this.generateEcosystemReport();
  }

  /**
   * Get all files in MEMU ecosystem
   */
  private getAllFiles(): string[] {
    const files: string[] = [];
    
    const scanDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Skip node_modules, .git, and other common directories
            if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
              scanDirectory(fullPath);
            }
          } else {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Cannot scan directory ${dir}:`, error);
      }
    };

    scanDirectory(this.basePath);
    return files;
  }

  /**
   * Analyze individual file with Ollama
   */
  private async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const content = fs.readFileSync(filePath, 'utf8');
    const stat = fs.statSync(filePath);
    const fileType = path.extname(filePath);

    // Create analysis prompt for Ollama
    const analysisPrompt = this.createAnalysisPrompt(filePath, content, fileType);
    
    const ollamaAnalysis = await ollamaService.sendMessage(analysisPrompt, undefined, {
      systemPrompt: `You are an expert software architect analyzing code for the IZA OS ecosystem. You specialize in:
- Enterprise-scale TypeScript/React applications
- Python backend services and APIs
- Mobile-first responsive design
- AI agent integration and orchestration
- Compliance and security standards
- Performance optimization
- Code quality and maintainability

Provide detailed analysis focusing on integration opportunities, alignment issues, and optimization suggestions.`
    });

    return {
      filePath,
      fileType,
      size: stat.size,
      lastModified: stat.mtime,
      analysis: this.parseOllamaAnalysis(ollamaAnalysis)
    };
  }

  /**
   * Create analysis prompt for Ollama
   */
  private createAnalysisPrompt(filePath: string, content: string, fileType: string): string {
    const relativePath = path.relative(this.basePath, filePath);
    
    return `Analyze this file from the IZA OS MEMU ecosystem:

**File Path:** ${relativePath}
**File Type:** ${fileType}
**File Size:** ${content.length} characters

**File Content:**
\`\`\`${fileType}
${content.substring(0, 2000)}${content.length > 2000 ? '\n... (truncated)' : ''}
\`\`\`

**Analysis Requirements:**
1. **Purpose**: What does this file do in the ecosystem?
2. **Integration Points**: How does it connect with other IZA OS components?
3. **Alignment Issues**: Any inconsistencies with IZA OS standards?
4. **Optimization Suggestions**: How can this be improved?
5. **Compliance Status**: Does it meet enterprise standards?

**IZA OS Context:**
- $1.4B ecosystem value
- 29 specialized AI agents
- 156 automated workflows
- 95% automation level
- Mobile-first deployment
- Enterprise compliance (GDPR, SOC 2, ISO 27001, HIPAA)

Provide structured analysis with specific, actionable recommendations.`;
  }

  /**
   * Parse Ollama analysis response
   */
  private parseOllamaAnalysis(analysis: string): FileAnalysis['analysis'] {
    // Extract structured information from Ollama response
    const lines = analysis.split('\n');
    
    return {
      purpose: this.extractSection(lines, 'Purpose') || 'Analysis pending',
      integrationPoints: this.extractList(lines, 'Integration Points'),
      alignmentIssues: this.extractList(lines, 'Alignment Issues'),
      optimizationSuggestions: this.extractList(lines, 'Optimization Suggestions'),
      complianceStatus: this.extractSection(lines, 'Compliance Status') || 'Pending review'
    };
  }

  /**
   * Extract section from analysis text
   */
  private extractSection(lines: string[], sectionName: string): string | null {
    const sectionIndex = lines.findIndex(line => 
      line.toLowerCase().includes(sectionName.toLowerCase())
    );
    
    if (sectionIndex !== -1 && sectionIndex + 1 < lines.length) {
      return lines[sectionIndex + 1].trim();
    }
    
    return null;
  }

  /**
   * Extract list from analysis text
   */
  private extractList(lines: string[], listName: string): string[] {
    const listIndex = lines.findIndex(line => 
      line.toLowerCase().includes(listName.toLowerCase())
    );
    
    if (listIndex === -1) return [];
    
    const items: string[] = [];
    for (let i = listIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        items.push(line.substring(1).trim());
      } else if (line === '') {
        break;
      }
    }
    
    return items;
  }

  /**
   * Generate comprehensive ecosystem report
   */
  private generateEcosystemReport(): EcosystemAnalysis {
    const totalFiles = this.analysisResults.length;
    const totalSize = this.analysisResults.reduce((sum, file) => sum + file.size, 0);
    
    const fileTypes: Record<string, number> = {};
    this.analysisResults.forEach(file => {
      fileTypes[file.fileType] = (fileTypes[file.fileType] || 0) + 1;
    });

    const alignmentIssues = this.analysisResults
      .flatMap(file => file.analysis.alignmentIssues)
      .filter((issue, index, arr) => arr.indexOf(issue) === index);

    const optimizationOpportunities = this.analysisResults
      .flatMap(file => file.analysis.optimizationSuggestions)
      .filter((suggestion, index, arr) => arr.indexOf(suggestion) === index);

    const complianceGaps = this.analysisResults
      .filter(file => file.analysis.complianceStatus !== 'Compliant')
      .map(file => `${path.basename(file.filePath)}: ${file.analysis.complianceStatus}`);

    const integrationScore = this.calculateIntegrationScore();

    return {
      totalFiles,
      totalSize,
      fileTypes,
      integrationScore,
      alignmentIssues,
      optimizationOpportunities,
      complianceGaps,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Calculate integration score
   */
  private calculateIntegrationScore(): number {
    const totalFiles = this.analysisResults.length;
    const filesWithIntegrationPoints = this.analysisResults.filter(
      file => file.analysis.integrationPoints.length > 0
    ).length;
    
    return Math.round((filesWithIntegrationPoints / totalFiles) * 100);
  }

  /**
   * Generate strategic recommendations
   */
  private generateRecommendations(): string[] {
    return [
      'Implement unified API gateway for all MEMU services',
      'Standardize authentication across all components',
      'Create mobile-first responsive design system',
      'Implement real-time monitoring and observability',
      'Establish automated testing and CI/CD pipelines',
      'Optimize database queries and caching strategies',
      'Implement comprehensive error handling and logging',
      'Create documentation and API specifications',
      'Establish security and compliance monitoring',
      'Implement performance monitoring and optimization'
    ];
  }

  /**
   * Analyze repository alignment
   */
  async analyzeRepositoryAlignment(repositories: string[]): Promise<RepositoryAlignment[]> {
    const alignments: RepositoryAlignment[] = [];

    for (const repo of repositories) {
      const alignmentPrompt = `Analyze alignment between MEMU ecosystem and ${repo} repository:

**Repository:** ${repo}
**MEMU Ecosystem:** IZA OS with $1.4B value, 29 agents, 156 workflows

**Analysis Requirements:**
1. **Alignment Score**: 0-100 score for integration compatibility
2. **Missing Components**: What's missing for full integration?
3. **Duplicate Components**: What overlaps exist?
4. **Integration Points**: How can they connect?
5. **Recommendations**: Specific steps for alignment

Provide detailed analysis with actionable recommendations.`;

      const analysis = await ollamaService.sendMessage(alignmentPrompt, undefined, {
        systemPrompt: 'You are an expert in enterprise software architecture and repository integration. Focus on practical, implementable solutions.'
      });

      alignments.push({
        repository: repo,
        alignmentScore: this.extractScore(analysis),
        missingComponents: this.extractList(analysis.split('\n'), 'Missing Components'),
        duplicateComponents: this.extractList(analysis.split('\n'), 'Duplicate Components'),
        integrationPoints: this.extractList(analysis.split('\n'), 'Integration Points'),
        recommendations: this.extractList(analysis.split('\n'), 'Recommendations')
      });
    }

    return alignments;
  }

  /**
   * Extract score from analysis
   */
  private extractScore(analysis: string): number {
    const scoreMatch = analysis.match(/(\d+)\/100|(\d+)%/);
    return scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : 0;
  }

  /**
   * Get analysis results
   */
  getAnalysisResults(): FileAnalysis[] {
    return this.analysisResults;
  }

  /**
   * Export analysis to JSON
   */
  exportAnalysis(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      analysis: this.analysisResults,
      summary: this.generateEcosystemReport()
    }, null, 2);
  }
}

// Export singleton instance
export const memuEcosystemAnalyzer = new MEMUEcosystemAnalyzer();
export default memuEcosystemAnalyzer;
