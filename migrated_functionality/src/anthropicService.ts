import { Anthropic } from '@anthropic-ai/sdk';

// Anthropic API configuration
const ANTHROPIC_CONFIG = {
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  model: import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  maxTokens: parseInt(import.meta.env.VITE_ANTHROPIC_MAX_TOKENS || '4000'),
};

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null;

if (ANTHROPIC_CONFIG.apiKey && ANTHROPIC_CONFIG.apiKey !== 'your_anthropic_api_key_here') {
  anthropicClient = new Anthropic({
    apiKey: ANTHROPIC_CONFIG.apiKey,
  });
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
}

export class AnthropicService {
  private client: Anthropic | null;

  constructor() {
    this.client = anthropicClient;
  }

  /**
   * Check if Anthropic API is properly configured
   */
  isConfigured(): boolean {
    return this.client !== null && ANTHROPIC_CONFIG.apiKey !== 'your_anthropic_api_key_here';
  }

  /**
   * Send a message to Claude and get a response
   */
  async sendMessage(
    message: string,
    systemPrompt?: string,
    conversationHistory: AnthropicMessage[] = []
  ): Promise<AnthropicResponse> {
    if (!this.client) {
      throw new Error('Anthropic API is not configured. Please set VITE_ANTHROPIC_API_KEY in your environment variables.');
    }

    try {
      const messages: AnthropicMessage[] = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await this.client.messages.create({
        model: ANTHROPIC_CONFIG.model,
        max_tokens: ANTHROPIC_CONFIG.maxTokens,
        system: systemPrompt || 'You are a helpful AI assistant integrated into the IZA OS autonomous agent system.',
        messages: messages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic API');
      }

      return {
        content: content.text,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
        model: response.model,
      };
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw new Error(`Failed to get response from Claude: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get agent recommendations based on current system state
   */
  async getAgentRecommendations(systemMetrics: any): Promise<string> {
    const systemPrompt = `You are an AI advisor for the IZA OS autonomous agent system. 
    Analyze the current system metrics and provide recommendations for optimizing agent performance, 
    resource allocation, and strategic decisions. Focus on actionable insights that can improve 
    the autonomous venture studio operations.`;

    const message = `Based on the current system metrics: ${JSON.stringify(systemMetrics, null, 2)}, 
    please provide strategic recommendations for optimizing our autonomous agent ecosystem.`;

    const response = await this.sendMessage(message, systemPrompt);
    return response.content;
  }

  /**
   * Analyze agent performance and suggest improvements
   */
  async analyzeAgentPerformance(agentData: any): Promise<string> {
    const systemPrompt = `You are a performance analyst for autonomous AI agents. 
    Analyze agent performance data and provide specific recommendations for improvement, 
    including optimization strategies, resource allocation, and potential bottlenecks.`;

    const message = `Please analyze this agent performance data and provide recommendations: 
    ${JSON.stringify(agentData, null, 2)}`;

    const response = await this.sendMessage(message, systemPrompt);
    return response.content;
  }

  /**
   * Generate strategic insights for the venture studio
   */
  async generateStrategicInsights(businessMetrics: any): Promise<string> {
    const systemPrompt = `You are a strategic advisor for an autonomous venture studio. 
    Analyze business metrics and market data to provide insights on growth opportunities, 
    market positioning, and strategic initiatives. Focus on actionable recommendations 
    that can drive revenue and ecosystem value.`;

    const message = `Based on these business metrics: ${JSON.stringify(businessMetrics, null, 2)}, 
    please provide strategic insights and recommendations for growing our autonomous venture studio.`;

    const response = await this.sendMessage(message, systemPrompt);
    return response.content;
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { configured: boolean; model: string; maxTokens: number } {
    return {
      configured: this.isConfigured(),
      model: ANTHROPIC_CONFIG.model,
      maxTokens: ANTHROPIC_CONFIG.maxTokens,
    };
  }
}

// Export singleton instance
export const anthropicService = new AnthropicService();

// Export configuration for display
export const anthropicConfig = ANTHROPIC_CONFIG;
