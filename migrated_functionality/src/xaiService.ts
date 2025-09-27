// xAI API configuration
const XAI_CONFIG = {
  apiKey: import.meta.env.VITE_XAI_API_KEY || '',
  model: import.meta.env.VITE_XAI_MODEL || 'grok-4-latest',
  baseUrl: 'https://api.x.ai/v1',
};

export interface XAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface XAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class XAIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = XAI_CONFIG.apiKey;
    this.model = XAI_CONFIG.model;
    this.baseUrl = XAI_CONFIG.baseUrl;
  }

  /**
   * Check if xAI API is properly configured
   */
  isConfigured(): boolean {
    return this.apiKey !== '' && this.apiKey !== 'your_xai_api_key_here';
  }

  /**
   * Send a message to Grok and get a response
   */
  async sendMessage(
    message: string,
    systemPrompt?: string,
    conversationHistory: XAIMessage[] = []
  ): Promise<{ content: string; usage: any; model: string }> {
    if (!this.isConfigured()) {
      throw new Error('xAI API is not configured. Please set VITE_XAI_API_KEY in your environment variables.');
    }

    try {
      const messages: XAIMessage[] = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      // Add system prompt if provided
      if (systemPrompt) {
        messages.unshift({ role: 'system', content: systemPrompt });
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          messages: messages,
          model: this.model,
          stream: false,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`xAI API Error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: XAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Grok');
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        model: data.model,
      };
    } catch (error) {
      console.error('xAI API Error:', error);
      throw new Error(`Failed to get response from Grok: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get agent recommendations using Grok
   */
  async getAgentRecommendations(systemMetrics: any): Promise<string> {
    const systemPrompt = `You are Grok, an AI advisor for the IZA OS autonomous agent system. 
    Analyze the current system metrics and provide recommendations for optimizing agent performance, 
    resource allocation, and strategic decisions. Focus on actionable insights that can improve 
    the autonomous venture studio operations. Be direct and insightful.`;

    const message = `Based on the current system metrics: ${JSON.stringify(systemMetrics, null, 2)}, 
    please provide strategic recommendations for optimizing our autonomous agent ecosystem.`;

    const response = await this.sendMessage(message, systemPrompt);
    return response.content;
  }

  /**
   * Analyze agent performance using Grok
   */
  async analyzeAgentPerformance(agentData: any): Promise<string> {
    const systemPrompt = `You are Grok, a performance analyst for autonomous AI agents. 
    Analyze agent performance data and provide specific recommendations for improvement, 
    including optimization strategies, resource allocation, and potential bottlenecks. 
    Be direct and actionable in your analysis.`;

    const message = `Please analyze this agent performance data and provide recommendations: 
    ${JSON.stringify(agentData, null, 2)}`;

    const response = await this.sendMessage(message, systemPrompt);
    return response.content;
  }

  /**
   * Generate strategic insights using Grok
   */
  async generateStrategicInsights(businessMetrics: any): Promise<string> {
    const systemPrompt = `You are Grok, a strategic advisor for an autonomous venture studio. 
    Analyze business metrics and market data to provide insights on growth opportunities, 
    market positioning, and strategic initiatives. Focus on actionable recommendations 
    that can drive revenue and ecosystem value. Be bold and strategic in your thinking.`;

    const message = `Based on these business metrics: ${JSON.stringify(businessMetrics, null, 2)}, 
    please provide strategic insights and recommendations for growing our autonomous venture studio.`;

    const response = await this.sendMessage(message, systemPrompt);
    return response.content;
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { configured: boolean; model: string; baseUrl: string } {
    return {
      configured: this.isConfigured(),
      model: this.model,
      baseUrl: this.baseUrl,
    };
  }
}

// Export singleton instance
export const xaiService = new XAIService();

// Export configuration for display
export const xaiConfig = XAI_CONFIG;
