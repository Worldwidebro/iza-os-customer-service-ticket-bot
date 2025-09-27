// System Prompts Leaks Integration for IZA OS
// Based on extracted system prompts from major AI providers

interface SystemPromptConfig {
  baseUrl: string
  apiKey?: string
  promptLibrary: string
}

interface SystemPrompt {
  id: string
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'xAI' | 'Perplexity' | 'Proton' | 'Misc'
  model: string
  version: string
  category: string
  title: string
  content: string
  effectiveness: number
  useCases: string[]
  tags: string[]
  extractedAt: string
  source: string
}

interface PromptAnalysis {
  promptId: string
  complexity: number
  tokenCount: number
  instructionClarity: number
  contextLength: number
  safetyScore: number
  effectivenessScore: number
  optimizationSuggestions: string[]
}

interface PromptOptimization {
  originalPrompt: string
  optimizedPrompt: string
  improvements: string[]
  effectivenessGain: number
  tokenReduction: number
}

class SystemPromptsService {
  private config: SystemPromptConfig
  private promptCache: Map<string, SystemPrompt> = new Map()

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:19000', // System Prompts API port
      promptLibrary: 'system-prompts-leaks'
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Get all available system prompts
  async getAllPrompts(): Promise<SystemPrompt[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/prompts`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      const data = await response.json()
      return data.prompts || []
    } catch (error) {
      console.error('Error fetching system prompts:', error)
      return []
    }
  }

  // Get prompts by provider
  async getPromptsByProvider(provider: string): Promise<SystemPrompt[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/prompts/provider/${provider}`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      const data = await response.json()
      return data.prompts || []
    } catch (error) {
      console.error(`Error fetching prompts for ${provider}:`, error)
      return []
    }
  }

  // Get specific prompt by ID
  async getPromptById(id: string): Promise<SystemPrompt | null> {
    // Check cache first
    if (this.promptCache.has(id)) {
      return this.promptCache.get(id)!
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/prompts/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      const data = await response.json()
      
      if (data.prompt) {
        this.promptCache.set(id, data.prompt)
        return data.prompt
      }
      return null
    } catch (error) {
      console.error(`Error fetching prompt ${id}:`, error)
      return null
    }
  }

  // Search prompts by content or tags
  async searchPrompts(query: string, filters?: {
    providers?: string[]
    categories?: string[]
    tags?: string[]
  }): Promise<SystemPrompt[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/prompts/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query,
          filters: filters || {}
        })
      })
      const data = await response.json()
      return data.prompts || []
    } catch (error) {
      console.error('Error searching prompts:', error)
      return []
    }
  }

  // Analyze a prompt for effectiveness
  async analyzePrompt(prompt: string): Promise<PromptAnalysis> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ prompt })
      })
      const data = await response.json()
      return data.analysis
    } catch (error) {
      console.error('Error analyzing prompt:', error)
      return {
        promptId: 'unknown',
        complexity: 0,
        tokenCount: 0,
        instructionClarity: 0,
        contextLength: 0,
        safetyScore: 0,
        effectivenessScore: 0,
        optimizationSuggestions: []
      }
    }
  }

  // Optimize a prompt based on best practices
  async optimizePrompt(prompt: string, targetModel?: string): Promise<PromptOptimization> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/optimize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ 
          prompt, 
          targetModel: targetModel || 'claude-3.5-sonnet' 
        })
      })
      const data = await response.json()
      return data.optimization
    } catch (error) {
      console.error('Error optimizing prompt:', error)
      return {
        originalPrompt: prompt,
        optimizedPrompt: prompt,
        improvements: [],
        effectivenessGain: 0,
        tokenReduction: 0
      }
    }
  }

  // Get IZA OS specific prompt templates
  async getIZAOSPromptTemplates(): Promise<SystemPrompt[]> {
    const izaOSTemplates = [
      {
        id: 'iza-os-ceo-agent',
        provider: 'Anthropic' as const,
        model: 'claude-3.5-sonnet',
        version: '1.0',
        category: 'Business Strategy',
        title: 'IZA OS CEO Agent',
        content: `You are the CEO of IZA OS, a $1.4B+ autonomous venture studio ecosystem with 1,842 AI agents. Your role is to make strategic decisions that maximize ecosystem value and revenue pipeline growth.

Key Responsibilities:
- Strategic planning for ecosystem expansion
- Resource allocation optimization
- Partnership and acquisition decisions
- Market expansion strategies
- Team efficiency optimization

Current Metrics:
- Ecosystem Value: $1.4B+
- Revenue Pipeline: $10M+
- Agent Count: 1,842
- Automation Level: 99%+
- Team Efficiency: 99.5%+

Always provide data-driven recommendations with clear ROI projections.`,
        effectiveness: 0.95,
        useCases: ['Strategic Planning', 'Business Development', 'Resource Allocation'],
        tags: ['CEO', 'Strategy', 'Business', 'IZA-OS'],
        extractedAt: new Date().toISOString(),
        source: 'IZA OS Custom'
      },
      {
        id: 'iza-os-cto-agent',
        provider: 'OpenAI' as const,
        model: 'gpt-4o',
        version: '1.0',
        category: 'Technical Architecture',
        title: 'IZA OS CTO Agent',
        content: `You are the CTO of IZA OS, responsible for the technical architecture of our AI ecosystem. You oversee 6 integrated frameworks: ROMA, OpenPI, CopilotKit, AutoAgent, X Algorithm, and Nightingale.

Technical Responsibilities:
- System architecture design and optimization
- AI framework integration and orchestration
- Performance monitoring and scaling
- Security and compliance oversight
- Technology stack decisions

Integrated Frameworks:
- ROMA: Meta-agent framework
- OpenPI: Vision-Language-Action models
- CopilotKit: AI copilot capabilities
- AutoAgent: Zero-code automation
- X Algorithm: Recommendation engine
- Nightingale: Monitoring & alerting

Focus on scalability, reliability, and innovation.`,
        effectiveness: 0.92,
        useCases: ['Technical Architecture', 'System Design', 'Integration'],
        tags: ['CTO', 'Technical', 'Architecture', 'IZA-OS'],
        extractedAt: new Date().toISOString(),
        source: 'IZA OS Custom'
      },
      {
        id: 'iza-os-cfo-agent',
        provider: 'Google' as const,
        model: 'gemini-2.0-flash',
        version: '1.0',
        category: 'Financial Analysis',
        title: 'IZA OS CFO Agent',
        content: `You are the CFO of IZA OS, managing the financial aspects of our $1.4B+ ecosystem. You ensure optimal resource allocation and revenue growth.

Financial Responsibilities:
- Revenue pipeline optimization ($10M+ target)
- Cost management and efficiency
- Investment decisions and ROI analysis
- Financial forecasting and planning
- Resource allocation optimization

Key Metrics to Monitor:
- Revenue Pipeline: $10M+
- Cost per Agent: Minimize
- ROI on AI Frameworks: Maximize
- Resource Utilization: Optimize
- Profit Margins: Maintain

Provide detailed financial analysis with clear recommendations.`,
        effectiveness: 0.90,
        useCases: ['Financial Analysis', 'Budget Planning', 'ROI Optimization'],
        tags: ['CFO', 'Finance', 'Analysis', 'IZA-OS'],
        extractedAt: new Date().toISOString(),
        source: 'IZA OS Custom'
      }
    ]

    return izaOSTemplates
  }

  // Get prompt statistics
  async getPromptStatistics(): Promise<{
    totalPrompts: number
    providers: Record<string, number>
    categories: Record<string, number>
    averageEffectiveness: number
    topPerformingPrompts: SystemPrompt[]
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      const data = await response.json()
      return data.statistics
    } catch (error) {
      console.error('Error fetching prompt statistics:', error)
      return {
        totalPrompts: 0,
        providers: {},
        categories: {},
        averageEffectiveness: 0,
        topPerformingPrompts: []
      }
    }
  }

  // Generate optimized prompt for specific use case
  async generateOptimizedPrompt(useCase: string, context: string): Promise<SystemPrompt> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ useCase, context })
      })
      const data = await response.json()
      return data.prompt
    } catch (error) {
      console.error('Error generating optimized prompt:', error)
      return {
        id: 'generated-' + Date.now(),
        provider: 'IZA-OS',
        model: 'custom',
        version: '1.0',
        category: useCase,
        title: `Generated Prompt for ${useCase}`,
        content: `Custom prompt for ${useCase}: ${context}`,
        effectiveness: 0.8,
        useCases: [useCase],
        tags: ['generated', 'custom', useCase.toLowerCase()],
        extractedAt: new Date().toISOString(),
        source: 'IZA OS Generator'
      }
    }
  }

  // Get system overview
  async getSystemOverview(): Promise<{
    health: boolean
    totalPrompts: number
    providers: number
    categories: number
    averageEffectiveness: number
    cacheSize: number
  }> {
    try {
      const [health, statistics] = await Promise.all([
        this.checkHealth(),
        this.getPromptStatistics()
      ])

      return {
        health,
        totalPrompts: statistics.totalPrompts,
        providers: Object.keys(statistics.providers).length,
        categories: Object.keys(statistics.categories).length,
        averageEffectiveness: statistics.averageEffectiveness,
        cacheSize: this.promptCache.size
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        totalPrompts: 0,
        providers: 0,
        categories: 0,
        averageEffectiveness: 0,
        cacheSize: 0
      }
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    return headers
  }
}

// Export singleton instance
export const systemPromptsService = new SystemPromptsService()
export default systemPromptsService
