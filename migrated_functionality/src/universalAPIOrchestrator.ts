import { Anthropic } from '@anthropic-ai/sdk';
import { qwenService } from './qwenService';
import { izaModelStackService } from './izaModelStackService';

// Universal API Configuration
const API_CONFIG = {
  anthropic: {
    apiKey: (import.meta as any).env?.VITE_ANTHROPIC_API_KEY || '',
    model: (import.meta as any).env?.VITE_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt((import.meta as any).env?.VITE_ANTHROPIC_MAX_TOKENS || '4000'),
  },
  xai: {
    apiKey: (import.meta as any).env?.VITE_XAI_API_KEY || '',
    model: (import.meta as any).env?.VITE_XAI_MODEL || 'grok-4-latest',
    baseUrl: 'https://api.x.ai/v1',
  },
  qwen: {
    model: 'Qwen3-Next-80B-A3B-Instruct',
    maxTokens: 8192,
  },
  iza: {
    models: ['ceo', 'cto', 'marketing', 'finance', 'legal', 'hr', 'sales', 'product'],
    maxTokens: 2000,
  }
};

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: any;
  model: string;
  provider: 'claude' | 'grok' | 'qwen' | 'iza';
}

export interface APIError {
  message: string;
  code?: string;
  provider: 'claude' | 'grok' | 'qwen' | 'iza';
  retryable: boolean;
}

export class UniversalAPIOrchestrator {
  private anthropicClient: Anthropic | null = null;

  constructor() {
    // Initialize Anthropic client if configured
    if (API_CONFIG.anthropic.apiKey && API_CONFIG.anthropic.apiKey !== 'your_anthropic_api_key_here') {
      this.anthropicClient = new Anthropic({
        apiKey: API_CONFIG.anthropic.apiKey,
      });
    }
  }

  /**
   * Check which APIs are configured
   */
  getConfiguredProviders(): Array<'claude' | 'grok' | 'qwen' | 'iza'> {
    const providers: Array<'claude' | 'grok' | 'qwen' | 'iza'> = [];
    
    if (this.anthropicClient && API_CONFIG.anthropic.apiKey !== 'your_anthropic_api_key_here') {
      providers.push('claude');
    }
    
    if (API_CONFIG.xai.apiKey && API_CONFIG.xai.apiKey !== 'your_xai_api_key_here') {
      providers.push('grok');
    }
    
    // Qwen is always available if the backend is running
    providers.push('qwen');
    
    // IZA OS models are always available
    providers.push('iza');
    
    return providers;
  }

  /**
   * Send message to Claude
   */
  private async sendToClaude(
    message: string,
    systemPrompt?: string,
    conversationHistory: AIMessage[] = []
  ): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw new Error('Claude API is not configured');
    }

    try {
      const messages: AIMessage[] = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await this.anthropicClient.messages.create({
        model: API_CONFIG.anthropic.model,
        max_tokens: API_CONFIG.anthropic.maxTokens,
        system: systemPrompt || 'You are a helpful AI assistant integrated into the IZA OS autonomous agent system.',
        messages: messages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return {
        content: content.text,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
        model: response.model,
        provider: 'claude',
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw {
        message: error instanceof Error ? error.message : 'Claude API error',
        provider: 'claude' as const,
        retryable: true
      };
    }
  }

  /**
   * Send message to Grok (xAI)
   */
  private async sendToGrok(
    message: string,
    systemPrompt?: string,
    conversationHistory: AIMessage[] = []
  ): Promise<AIResponse> {
    if (!API_CONFIG.xai.apiKey || API_CONFIG.xai.apiKey === 'your_xai_api_key_here') {
      throw new Error('Grok API is not configured');
    }

    try {
      const messages: AIMessage[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Add conversation history
      messages.push(...conversationHistory);
      
      // Add current message
      messages.push({ role: 'user', content: message });

      const response = await fetch(`${API_CONFIG.xai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.xai.apiKey}`,
        },
        body: JSON.stringify({
          messages: messages,
          model: API_CONFIG.xai.model,
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Grok API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        model: data.model,
        provider: 'grok',
      };
    } catch (error) {
      console.error('Grok API error:', error);
      throw {
        message: error instanceof Error ? error.message : 'Grok API error',
        provider: 'grok' as const,
        retryable: true
      };
    }
  }

  /**
   * Send message to Qwen3-Next-80B-A3B-Instruct
   */
  private async sendToQwen(
    message: string,
    systemPrompt?: string,
    conversationHistory: AIMessage[] = []
  ): Promise<AIResponse> {
    try {
      const messages: AIMessage[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Add conversation history
      messages.push(...conversationHistory);
      
      // Add current message
      messages.push({ role: 'user', content: message });
      
      const response = await qwenService.chat(messages, API_CONFIG.qwen.maxTokens);
      
      return {
        content: response,
        model: API_CONFIG.qwen.model,
        provider: 'qwen'
      };
    } catch (error) {
      console.error('Qwen API error:', error);
      throw {
        message: error instanceof Error ? error.message : 'Qwen API error',
        provider: 'qwen' as const,
        retryable: true
      };
    }
  }

  /**
   * Send message to IZA OS model stack
   */
  private async sendToIZA(
    message: string,
    systemPrompt?: string,
    conversationHistory: AIMessage[] = [],
    modelType: string = 'ceo'
  ): Promise<AIResponse> {
    try {
      // Combine system prompt and message
      let fullPrompt = message;
      if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\n${message}`;
      }
      
      const response = await izaModelStackService.generate({
        prompt: fullPrompt,
        model_type: modelType,
        max_tokens: API_CONFIG.iza.maxTokens,
        temperature: 0.7
      });
      
      return {
        content: response.content,
        model: response.model_name,
        provider: 'iza'
      };
    } catch (error) {
      console.error('IZA API error:', error);
      throw {
        message: error instanceof Error ? error.message : 'IZA API error',
        provider: 'iza' as const,
        retryable: true
      };
    }
  }

  /**
   * Send message to specified provider
   */
  async sendMessage(
    provider: 'claude' | 'grok' | 'qwen' | 'iza',
    message: string,
    systemPrompt?: string,
    conversationHistory: AIMessage[] = [],
    modelType?: string
  ): Promise<AIResponse> {
    if (provider === 'claude') {
      return this.sendToClaude(message, systemPrompt, conversationHistory);
    } else if (provider === 'grok') {
      return this.sendToGrok(message, systemPrompt, conversationHistory);
    } else if (provider === 'qwen') {
      return this.sendToQwen(message, systemPrompt, conversationHistory);
    } else if (provider === 'iza') {
      return this.sendToIZA(message, systemPrompt, conversationHistory, modelType || 'ceo');
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Send message with automatic fallback
   */
  async sendMessageWithFallback(
    message: string,
    systemPrompt?: string,
    conversationHistory: AIMessage[] = [],
    preferredProvider?: 'claude' | 'grok' | 'qwen' | 'iza'
  ): Promise<AIResponse> {
    const providers = this.getConfiguredProviders();
    
    if (providers.length === 0) {
      throw new Error('No AI providers are configured');
    }

    // Use preferred provider if available, otherwise use first available
    const provider = preferredProvider && providers.includes(preferredProvider) 
      ? preferredProvider 
      : providers[0];

    try {
      return await this.sendMessage(provider, message, systemPrompt, conversationHistory);
    } catch (error) {
      // Try fallback providers
      const fallbackProviders = providers.filter(p => p !== provider);
      
      for (const fallbackProvider of fallbackProviders) {
        try {
          return await this.sendMessage(fallbackProvider, message, systemPrompt, conversationHistory);
        } catch (fallbackError) {
          console.warn(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
        }
      }
      
      throw error; // All providers failed
    }
  }

  /**
   * Get agent recommendations using AI
   */
  async getAgentRecommendations(
    agentId: string,
    recommendationType: string = 'performance'
  ): Promise<string> {
    const systemPrompt = `You are an AI assistant specialized in agent performance optimization. 
    Provide specific, actionable recommendations for improving agent performance.`;
    
    const message = `Analyze agent ${agentId} and provide ${recommendationType} recommendations.`;
    
    const response = await this.sendMessageWithFallback(message, systemPrompt);
    return response.content;
  }

  /**
   * Analyze agent performance using AI
   */
  async analyzeAgentPerformance(agentData: any): Promise<string> {
    const systemPrompt = `You are an AI assistant specialized in agent performance analysis. 
    Analyze the provided agent data and provide insights on performance, bottlenecks, and optimization opportunities.`;
    
    const message = `Analyze this agent performance data: ${JSON.stringify(agentData)}`;
    
    const response = await this.sendMessageWithFallback(message, systemPrompt);
    return response.content;
  }

  /**
   * Generate strategic insights using AI
   */
  async generateStrategicInsights(context: string): Promise<string> {
    const systemPrompt = `You are an AI assistant specialized in strategic business analysis. 
    Provide high-level strategic insights and recommendations based on the provided context.`;
    
    const message = `Generate strategic insights for: ${context}`;
    
    const response = await this.sendMessageWithFallback(message, systemPrompt);
    return response.content;
  }

  /**
   * Get configuration status for all providers
   */
  getConfigStatus(): {
    claude: { configured: boolean; model: string; maxTokens: number };
    grok: { configured: boolean; model: string; baseUrl: string };
    qwen: { configured: boolean; model: string; maxTokens: number };
    iza: { configured: boolean; models: string[]; maxTokens: number };
  } {
    return {
      claude: {
        configured: this.anthropicClient !== null && API_CONFIG.anthropic.apiKey !== 'your_anthropic_api_key_here',
        model: API_CONFIG.anthropic.model,
        maxTokens: API_CONFIG.anthropic.maxTokens,
      },
      grok: {
        configured: API_CONFIG.xai.apiKey !== '' && API_CONFIG.xai.apiKey !== 'your_xai_api_key_here',
        model: API_CONFIG.xai.model,
        baseUrl: API_CONFIG.xai.baseUrl,
      },
      qwen: {
        configured: true, // Always available if backend is running
        model: API_CONFIG.qwen.model,
        maxTokens: API_CONFIG.qwen.maxTokens,
      },
      iza: {
        configured: true, // Always available
        models: API_CONFIG.iza.models,
        maxTokens: API_CONFIG.iza.maxTokens,
      },
    };
  }
}

// Export singleton instance
export const universalAPIOrchestrator = new UniversalAPIOrchestrator();

// Export configuration for display
export const apiConfig = API_CONFIG;