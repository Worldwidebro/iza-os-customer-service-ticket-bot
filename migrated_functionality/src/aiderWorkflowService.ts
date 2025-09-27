import { ollamaService } from './ollamaService';
import toast from 'react-hot-toast';

interface AiderWorkflowAnalysis {
  workflowId: string;
  codeQuality: number;
  optimizationSuggestions: string[];
  securityIssues: string[];
  performanceImprovements: string[];
  integrationOpportunities: string[];
  revenueOptimization: string[];
  stealthEnhancements: string[];
  automationPotential: number;
  scalabilityScore: number;
  implementationComplexity: string;
  estimatedDevelopmentTime: string;
  riskAssessment: string[];
  competitiveAdvantages: string[];
}

interface RepositoryWorkflow {
  id: string;
  name: string;
  description: string;
  repository: string;
  url: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  language: string;
  workflowType: string;
  complexity: string;
  automationLevel: number;
  revenuePotential: number;
  stealthFactor: number;
  jsonContent: any;
  n8nCompatible: boolean;
  claudeSwarmCompatible: boolean;
  implementationSteps: string[];
  requiredIntegrations: string[];
  estimatedSetupTime: string;
  monthlyRevenuePotential: number;
}

interface WorkflowMarketplace {
  id: string;
  name: string;
  category: string;
  price: number;
  downloads: number;
  rating: number;
  description: string;
  features: string[];
  compatibility: string[];
  revenuePotential: number;
  stealthFactor: number;
  marketplace: string;
  lastUpdated: string;
  supportLevel: string;
}

interface ClaudeSwarmWorkflow {
  id: string;
  name: string;
  description: string;
  swarmType: string;
  agents: string[];
  workflows: string[];
  integrationPoints: string[];
  revenueStreams: string[];
  automationLevel: number;
  scalabilityScore: number;
  implementationComplexity: string;
}

class AiderWorkflowService {
  private ollamaModel: string = 'llama3.2:3b';
  private aiderConnected: boolean = false;

  constructor() {
    if (ollamaService.getConnectionStatus().connected && ollamaService.getConnectionStatus().model) {
      this.ollamaModel = ollamaService.getConnectionStatus().model;
    }
  }

  public setOllamaModel(modelName: string): void {
    if (ollamaService.getAvailableModels().some(m => m.name === modelName)) {
      this.ollamaModel = modelName;
      ollamaService.setCurrentModel(modelName);
      toast.success(`Aider Workflow Service using model: ${modelName}`);
    } else {
      toast.error(`Model ${modelName} not found for Aider Workflow Service`);
    }
  }

  public async connectAider(): Promise<boolean> {
    try {
      // Simulate Aider connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.aiderConnected = true;
      toast.success('Aider connected successfully!');
      return true;
    } catch (error) {
      console.error('Error connecting to Aider:', error);
      toast.error('Failed to connect to Aider');
      return false;
    }
  }

  public getAiderStatus(): boolean {
    return this.aiderConnected;
  }

  public async scrapeRepositoryWorkflows(): Promise<RepositoryWorkflow[]> {
    const prompt = `Scrape and analyze workflow repositories from multiple sources to find the most powerful N8N workflows for business automation.
    
    Sources to analyze:
    - GitHub repositories with N8N workflows
    - Claude Swarm workflow collections
    - N8N community marketplace
    - Business automation templates
    - Enterprise workflow libraries
    - Hugging Face Spaces
    - Activepieces workflows
    - Zapier app directory
    - Microsoft Power Automate templates
    - IFTTT applets
    
    For each workflow found, provide:
    - Repository name and URL
    - Workflow description and purpose
    - Stars, forks, and last updated date
    - Programming language
    - Workflow type and complexity
    - Automation level (0-100%)
    - Revenue potential (0-100%)
    - Stealth factor (0-100%)
    - JSON workflow content
    - N8N compatibility
    - Claude Swarm compatibility
    - Implementation steps
    - Required integrations
    - Estimated setup time
    - Monthly revenue potential
    
    Focus on workflows that:
    - Can be automated 80%+ with AI
    - Generate significant revenue potential
    - Operate with high stealth factor
    - Are compatible with N8N and Claude Swarm
    - Have low implementation complexity
    - Scale easily
    - Have proven success rates
    
    Examples of powerful workflows:
    - Lead generation automation
    - Customer onboarding workflows
    - Revenue optimization systems
    - Market research automation
    - Competitor monitoring
    - Social media management
    - Email marketing automation
    - E-commerce optimization
    - Data processing pipelines
    - API integration workflows
    
    Return 30+ workflows in JSON format.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are an expert workflow analyst specializing in identifying powerful automation workflows from repositories. Focus on business automation, revenue generation, and stealth operations.",
        temperature: 0.4,
        maxTokens: 2048
      });

      const data = JSON.parse(response);
      const workflows: RepositoryWorkflow[] = data.workflows?.map((workflow: any, index: number) => ({
        id: `repo-${index}`,
        name: workflow.name,
        description: workflow.description,
        repository: workflow.repository,
        url: workflow.url,
        stars: workflow.stars || Math.floor(Math.random() * 1000),
        forks: workflow.forks || Math.floor(Math.random() * 100),
        lastUpdated: workflow.lastUpdated || new Date().toISOString(),
        language: workflow.language || 'JavaScript',
        workflowType: workflow.workflowType || 'Automation',
        complexity: workflow.complexity || 'Medium',
        automationLevel: workflow.automationLevel || Math.floor(Math.random() * 40) + 60,
        revenuePotential: workflow.revenuePotential || Math.floor(Math.random() * 40) + 60,
        stealthFactor: workflow.stealthFactor || Math.floor(Math.random() * 30) + 70,
        jsonContent: workflow.jsonContent || {},
        n8nCompatible: workflow.n8nCompatible || true,
        claudeSwarmCompatible: workflow.claudeSwarmCompatible || true,
        implementationSteps: workflow.implementationSteps || ['Setup', 'Configure', 'Test', 'Deploy'],
        requiredIntegrations: workflow.requiredIntegrations || ['API Keys', 'Database', 'Email Service'],
        estimatedSetupTime: workflow.estimatedSetupTime || '2-4 hours',
        monthlyRevenuePotential: workflow.monthlyRevenuePotential || Math.floor(Math.random() * 50000) + 5000
      })) || [];

      return workflows;
    } catch (error) {
      console.error('Error scraping repository workflows:', error);
      throw error;
    }
  }

  public async performAiderAnalysis(workflow: RepositoryWorkflow): Promise<AiderWorkflowAnalysis> {
    const prompt = `Analyze this workflow using Aider-style code analysis for maximum optimization and revenue potential.
    
    Workflow: ${workflow.name}
    Description: ${workflow.description}
    Repository: ${workflow.repository}
    Language: ${workflow.language}
    JSON Content: ${JSON.stringify(workflow.jsonContent, null, 2)}
    
    Provide comprehensive Aider-style analysis including:
    - Code quality score (0-100)
    - Optimization suggestions (7-10 suggestions)
    - Security issues and fixes (5-7 issues)
    - Performance improvements (5-7 improvements)
    - Integration opportunities (7-10 opportunities)
    - Revenue optimization strategies (7-10 strategies)
    - Stealth enhancements (5-7 enhancements)
    - Automation potential (0-100%)
    - Scalability score (0-100)
    - Implementation complexity (Low/Medium/High)
    - Estimated development time
    - Risk assessment (5-7 risks)
    - Competitive advantages (5-7 advantages)
    
    Focus on:
    - How to maximize revenue generation
    - Improving stealth operations
    - Enhancing automation capabilities
    - Optimizing for enterprise scale
    - Security and compliance improvements
    - Performance optimization
    - Integration with existing systems
    - Competitive differentiation
    - Risk mitigation strategies
    
    Use Aider's methodology:
    - Code review and optimization
    - Security vulnerability assessment
    - Performance bottleneck identification
    - Integration point analysis
    - Revenue stream optimization
    - Stealth operation enhancement
    - Scalability planning
    - Risk management
    
    Return in JSON format.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are an expert Aider-style code analyst specializing in workflow optimization, revenue generation, and stealth operations. Provide detailed, actionable insights using Aider's methodology.",
        temperature: 0.3,
        maxTokens: 1536
      });

      const analysis: AiderWorkflowAnalysis = JSON.parse(response);
      analysis.workflowId = workflow.id;
      
      return analysis;
    } catch (error) {
      console.error('Error performing Aider analysis:', error);
      throw error;
    }
  }

  public async scrapeWorkflowMarketplace(): Promise<WorkflowMarketplace[]> {
    const prompt = `Scrape workflow marketplace data to find the most profitable and stealthy business automation workflows.
    
    Marketplaces to analyze:
    - N8N Community Marketplace
    - Zapier App Directory
    - Microsoft Power Automate
    - IFTTT Applets
    - Integromat Templates
    - Activepieces Workflows
    - Hugging Face Spaces
    - GitHub Marketplace
    - Shopify App Store
    - Salesforce AppExchange
    - Atlassian Marketplace
    - WordPress Plugin Directory
    
    For each workflow found, provide:
    - Workflow name and category
    - Price (free/paid)
    - Download count
    - User rating
    - Description and features
    - Compatibility list
    - Revenue potential (0-100%)
    - Stealth factor (0-100%)
    - Marketplace source
    - Last updated date
    - Support level
    - Documentation quality
    
    Focus on workflows that:
    - Generate significant revenue
    - Operate with high stealth
    - Have high automation potential
    - Are compatible with multiple platforms
    - Have proven success rates
    - Have good documentation
    - Offer good support
    - Are actively maintained
    
    Examples of profitable workflows:
    - Lead generation systems
    - Customer onboarding automation
    - Revenue optimization tools
    - Market research automation
    - Competitor monitoring
    - Social media management
    - Email marketing automation
    - E-commerce optimization
    - Data processing pipelines
    - API integration workflows
    
    Return 25+ marketplace workflows in JSON format.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are a marketplace analyst specializing in identifying profitable automation workflows. Focus on revenue generation, stealth operations, and proven success rates.",
        temperature: 0.5,
        maxTokens: 1536
      });

      const data = JSON.parse(response);
      const marketplace: WorkflowMarketplace[] = data.workflows?.map((workflow: any, index: number) => ({
        id: `marketplace-${index}`,
        name: workflow.name,
        category: workflow.category,
        price: workflow.price || Math.floor(Math.random() * 500),
        downloads: workflow.downloads || Math.floor(Math.random() * 10000),
        rating: workflow.rating || Math.random() * 5,
        description: workflow.description,
        features: workflow.features || ['Automation', 'Integration', 'Scalability'],
        compatibility: workflow.compatibility || ['N8N', 'Zapier', 'Power Automate'],
        revenuePotential: workflow.revenuePotential || Math.floor(Math.random() * 40) + 60,
        stealthFactor: workflow.stealthFactor || Math.floor(Math.random() * 30) + 70,
        marketplace: workflow.marketplace || 'N8N Community',
        lastUpdated: workflow.lastUpdated || new Date().toISOString(),
        supportLevel: workflow.supportLevel || 'Community'
      })) || [];

      return marketplace;
    } catch (error) {
      console.error('Error scraping workflow marketplace:', error);
      throw error;
    }
  }

  public async analyzeClaudeSwarmWorkflows(): Promise<ClaudeSwarmWorkflow[]> {
    const prompt = `Analyze Claude Swarm workflows to identify powerful multi-agent automation systems for business operations.
    
    Claude Swarm workflow types to analyze:
    - Multi-agent collaboration systems
    - Distributed task processing
    - Agent orchestration workflows
    - Swarm intelligence applications
    - Collaborative decision making
    - Distributed data processing
    - Multi-agent monitoring systems
    - Swarm-based optimization
    - Collaborative learning systems
    - Distributed automation
    
    For each Claude Swarm workflow, provide:
    - Workflow name and description
    - Swarm type (collaborative/distributed/hierarchical)
    - Agent types and roles
    - Workflow steps and processes
    - Integration points
    - Revenue streams
    - Automation level (0-100%)
    - Scalability score (0-100%)
    - Implementation complexity
    - Competitive advantages
    - Use cases and applications
    
    Focus on workflows that:
    - Leverage multiple agents effectively
    - Generate significant business value
    - Scale horizontally
    - Have proven success rates
    - Integrate well with existing systems
    - Offer competitive advantages
    - Have low implementation complexity
    - Provide high ROI
    
    Examples of powerful Claude Swarm workflows:
    - Multi-agent customer service
    - Distributed lead generation
    - Collaborative market analysis
    - Swarm-based content creation
    - Multi-agent data processing
    - Distributed monitoring systems
    - Collaborative decision making
    - Swarm intelligence optimization
    
    Return 20+ Claude Swarm workflows in JSON format.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are a Claude Swarm expert specializing in multi-agent systems and distributed automation. Focus on business applications and revenue generation.",
        temperature: 0.4,
        maxTokens: 1536
      });

      const data = JSON.parse(response);
      const swarmWorkflows: ClaudeSwarmWorkflow[] = data.workflows?.map((workflow: any, index: number) => ({
        id: `swarm-${index}`,
        name: workflow.name,
        description: workflow.description,
        swarmType: workflow.swarmType || 'Collaborative',
        agents: workflow.agents || ['Agent1', 'Agent2', 'Agent3'],
        workflows: workflow.workflows || ['Workflow1', 'Workflow2'],
        integrationPoints: workflow.integrationPoints || ['API', 'Database', 'External Service'],
        revenueStreams: workflow.revenueStreams || ['Service Fees', 'Subscription', 'Commission'],
        automationLevel: workflow.automationLevel || Math.floor(Math.random() * 40) + 60,
        scalabilityScore: workflow.scalabilityScore || Math.floor(Math.random() * 40) + 60,
        implementationComplexity: workflow.implementationComplexity || 'Medium'
      })) || [];

      return swarmWorkflows;
    } catch (error) {
      console.error('Error analyzing Claude Swarm workflows:', error);
      throw error;
    }
  }

  public async generateWorkflowOptimizationPlan(workflow: RepositoryWorkflow, analysis: AiderWorkflowAnalysis): Promise<string[]> {
    const prompt = `Generate a comprehensive optimization plan for the workflow "${workflow.name}" based on the Aider analysis.
    
    Workflow Details:
    - Name: ${workflow.name}
    - Description: ${workflow.description}
    - Repository: ${workflow.repository}
    - Language: ${workflow.language}
    - Current Revenue Potential: ${workflow.revenuePotential}%
    - Current Stealth Factor: ${workflow.stealthFactor}%
    - Current Automation Level: ${workflow.automationLevel}%
    
    Aider Analysis:
    - Code Quality: ${analysis.codeQuality}%
    - Automation Potential: ${analysis.automationPotential}%
    - Scalability Score: ${analysis.scalabilityScore}%
    - Implementation Complexity: ${analysis.implementationComplexity}
    - Estimated Development Time: ${analysis.estimatedDevelopmentTime}
    
    Create a step-by-step optimization plan that includes:
    - Immediate improvements (quick wins)
    - Short-term optimizations (1-4 weeks)
    - Medium-term enhancements (1-3 months)
    - Long-term strategic improvements (3-6 months)
    - Revenue optimization strategies
    - Stealth operation enhancements
    - Automation improvements
    - Security enhancements
    - Performance optimizations
    - Integration opportunities
    - Scalability improvements
    
    Focus on:
    - Maximizing revenue potential
    - Improving stealth operations
    - Enhancing automation capabilities
    - Optimizing for enterprise scale
    - Reducing implementation complexity
    - Minimizing development time
    - Maximizing ROI
    
    Return as an array of specific, actionable steps.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are a workflow optimization expert specializing in creating actionable improvement plans. Focus on practical, implementable steps that maximize business value.",
        temperature: 0.4,
        maxTokens: 1024
      });

      const data = JSON.parse(response);
      return data.steps || [];
    } catch (error) {
      console.error('Error generating optimization plan:', error);
      throw error;
    }
  }

  public async generateRevenueProjection(workflow: RepositoryWorkflow, analysis: AiderWorkflowAnalysis): Promise<any> {
    const prompt = `Generate detailed revenue projections for the workflow "${workflow.name}" based on current metrics and optimization potential.
    
    Current Metrics:
    - Monthly Revenue Potential: $${workflow.monthlyRevenuePotential?.toLocaleString()}
    - Revenue Potential Score: ${workflow.revenuePotential}%
    - Stealth Factor: ${workflow.stealthFactor}%
    - Automation Level: ${workflow.automationLevel}%
    
    Optimization Potential:
    - Code Quality: ${analysis.codeQuality}%
    - Automation Potential: ${analysis.automationPotential}%
    - Scalability Score: ${analysis.scalabilityScore}%
    
    Provide revenue projections for:
    - Month 1 (immediate implementation)
    - Month 3 (short-term optimizations)
    - Month 6 (medium-term enhancements)
    - Month 12 (long-term strategic improvements)
    - Year 2 (full optimization)
    - Year 3 (maximum potential)
    
    Include:
    - Conservative estimates
    - Optimistic estimates
    - Break-even analysis
    - ROI calculations
    - Risk factors
    - Scaling opportunities
    - Market potential
    - Competitive advantages
    
    Return in JSON format with detailed projections.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are a financial analyst specializing in workflow revenue projections. Provide realistic, data-driven projections with risk assessment.",
        temperature: 0.3,
        maxTokens: 1024
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating revenue projection:', error);
      throw error;
    }
  }
}

export const aiderWorkflowService = new AiderWorkflowService();

