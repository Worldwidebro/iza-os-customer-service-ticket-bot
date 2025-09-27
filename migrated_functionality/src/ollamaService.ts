/**
 * Ollama Service Integration for IZA OS
 * Local LLM deployment for enterprise-scale AI operations
 * Mobile-optimized for touch interactions
 */

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaConfig {
  baseUrl: string;
  defaultModel: string;
  timeout: number;
  maxTokens: number;
  temperature: number;
}

class OllamaService {
  private config: OllamaConfig;
  private isConnected: boolean = false;
  private availableModels: OllamaModel[] = [];

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:11434', // Default Ollama port
      defaultModel: 'llama3.2:3b', // Mobile-optimized model
      timeout: 30000, // 30 seconds for mobile
      maxTokens: 2048, // Mobile-optimized token limit
      temperature: 0.7
    };
  }

  /**
   * Initialize Ollama connection and check available models
   */
  async initialize(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (response.ok) {
        const data = await response.json();
        this.availableModels = data.models || [];
        this.isConnected = true;
        
        // Auto-select best mobile model if available
        this.selectOptimalMobileModel();
        
        console.log('✅ Ollama connected successfully');
        console.log(`📱 Available models: ${this.availableModels.length}`);
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Ollama not available:', error);
      this.isConnected = false;
    }
    return false;
  }

  /**
   * Select optimal model for mobile performance
   */
  private selectOptimalMobileModel(): void {
    const mobileOptimizedModels = [
      'llama3.2:3b',      // Best for mobile
      'llama3.2:1b',      // Ultra-lightweight
      'phi3:mini',        // Microsoft's mobile model
      'gemma2:2b',        // Google's efficient model
      'qwen2.5:3b'        // Alibaba's mobile model
    ];

    for (const modelName of mobileOptimizedModels) {
      const model = this.availableModels.find(m => m.name === modelName);
      if (model) {
        this.config.defaultModel = modelName;
        console.log(`📱 Selected mobile model: ${modelName}`);
        break;
      }
    }
  }

  /**
   * Send message to Ollama with mobile optimization
   */
  async sendMessage(
    message: string, 
    model?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Ollama not connected. Please ensure Ollama is running on localhost:11434');
    }

    const selectedModel = model || this.config.defaultModel;
    const systemPrompt = options?.systemPrompt || this.getDefaultSystemPrompt();

    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
          stream: false,
          options: {
            temperature: options?.temperature || this.config.temperature,
            num_predict: options?.maxTokens || this.config.maxTokens,
          }
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response.trim();
    } catch (error) {
      console.error('Ollama sendMessage error:', error);
      throw new Error(`Failed to send message to Ollama: ${error}`);
    }
  }

  /**
   * Get agent recommendations using Ollama
   */
  async getAgentRecommendations(systemMetrics: any): Promise<string> {
    const prompt = `As an AI agent optimization expert, analyze these system metrics and provide specific recommendations:

System Metrics:
- Total Agents: ${systemMetrics.totalAgents}
- Active Agents: ${systemMetrics.activeAgents}
- Average Success Rate: ${systemMetrics.averageSuccessRate}%
- Timestamp: ${systemMetrics.timestamp}

Provide 3-5 specific, actionable recommendations to optimize agent performance, improve success rates, and enhance system efficiency. Focus on practical, implementable solutions.`;

    return this.sendMessage(prompt, undefined, {
      systemPrompt: "You are an expert AI agent system optimizer with deep knowledge of autonomous agent architectures, performance optimization, and enterprise-scale deployments."
    });
  }

  /**
   * Analyze agent performance using Ollama
   */
  async analyzeAgentPerformance(agentData: any[]): Promise<string> {
    const prompt = `Analyze the performance of these AI agents and provide insights:

Agent Data:
${agentData.map(agent => `
- Name: ${agent.name}
- Role: ${agent.role}
- Status: ${agent.status}
- Metrics: ${JSON.stringify(agent.metrics)}
`).join('\n')}

Provide a comprehensive analysis including:
1. Performance trends and patterns
2. Bottlenecks and optimization opportunities
3. Resource allocation recommendations
4. Scaling strategies for enterprise operations`;

    return this.sendMessage(prompt, undefined, {
      systemPrompt: "You are a senior AI systems analyst specializing in autonomous agent performance optimization and enterprise-scale AI operations."
    });
  }

  /**
   * Generate strategic insights using Ollama
   */
  async generateStrategicInsights(businessMetrics: any): Promise<string> {
    const prompt = `Generate strategic insights for this enterprise AI ecosystem:

Business Metrics:
- Ecosystem Value: ${businessMetrics.ecosystemValue}
- Revenue Pipeline: ${businessMetrics.revenuePipeline}
- Automation Level: ${businessMetrics.automationLevel}
- Team Efficiency: ${businessMetrics.teamEfficiency}
- Agent Count: ${businessMetrics.agentCount}
- Timestamp: ${businessMetrics.timestamp}

Provide strategic insights covering:
1. Growth opportunities and market positioning
2. Technology roadmap recommendations
3. Revenue optimization strategies
4. Competitive advantages and differentiation
5. Risk assessment and mitigation strategies`;

    return this.sendMessage(prompt, undefined, {
      systemPrompt: "You are a strategic business consultant specializing in AI enterprise ecosystems, venture capital, and billion-dollar technology companies."
    });
  }

  /**
   * Get default system prompt for IZA OS context
   */
  private getDefaultSystemPrompt(): string {
    return `You are an AI assistant integrated into the IZA OS ecosystem, a $1.4B enterprise-grade autonomous agent platform. You have access to:

- 29 specialized AI agents
- 156 automated workflows  
- 95% automation level
- $10M+ revenue pipeline
- Mobile-optimized deployment
- Enterprise compliance (GDPR, SOC 2, ISO 27001, HIPAA)

Provide concise, actionable responses optimized for mobile interaction and enterprise decision-making.`;
  }

  /**
   * Pull a new model from Ollama registry
   */
  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
          stream: false
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to pull model:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): OllamaModel[] {
    return this.availableModels;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; model: string; modelsCount: number } {
    return {
      connected: this.isConnected,
      model: this.config.defaultModel,
      modelsCount: this.availableModels.length
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get mobile-optimized model recommendations
   */
  getMobileModelRecommendations(): string[] {
    return [
      'llama3.2:3b - Best balance of performance and mobile efficiency',
      'llama3.2:1b - Ultra-lightweight for basic tasks',
      'phi3:mini - Microsoft\'s optimized mobile model',
      'gemma2:2b - Google\'s efficient model',
      'qwen2.5:3b - Alibaba\'s mobile-optimized model'
    ];
  }
}

// Export singleton instance
export const ollamaService = new OllamaService();
export default ollamaService;
