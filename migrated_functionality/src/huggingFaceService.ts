// Hugging Face Inference API configuration
const HF_CONFIG = {
  apiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY || '',
  baseUrl: 'https://api-inference.huggingface.co/models',
  models: {
    // Text Generation Models
    textGeneration: {
      'microsoft/DialoGPT-medium': 'Conversational AI for agent interactions',
      'microsoft/DialoGPT-large': 'Higher quality conversations',
      'facebook/blenderbot-400M-distill': 'Open-domain conversational AI',
      'EleutherAI/gpt-neo-2.7B': 'Open-source GPT alternative',
      'EleutherAI/gpt-j-6B': 'Larger, more capable text generation'
    },
    // Code Generation Models
    codeGeneration: {
      'Salesforce/codegen-350M-mono': 'Code generation from natural language',
      'Salesforce/codegen-2B-mono': 'Larger code generation model',
      'bigcode/starcoder': 'Code completion and generation',
      'bigcode/starcoder2-3b': 'Improved code generation'
    },
    // Business Analysis Models
    businessAnalysis: {
      'microsoft/DialoGPT-large': 'Business analysis conversations',
      'facebook/blenderbot-400M-distill': 'Strategic planning discussions',
      'EleutherAI/gpt-neo-2.7B': 'Complex business reasoning'
    }
  },
  defaultModel: 'microsoft/DialoGPT-medium'
};

export interface HFMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface HFResponse {
  content: string;
  model: string;
  provider: 'huggingface';
  usage?: any;
}

export interface HFModelInfo {
  name: string;
  description: string;
  category: 'textGeneration' | 'codeGeneration' | 'businessAnalysis';
}

export class HuggingFaceService {
  private apiKey: string;
  private baseUrl: string;
  private models: typeof HF_CONFIG.models;

  constructor() {
    this.apiKey = HF_CONFIG.apiKey;
    this.baseUrl = HF_CONFIG.baseUrl;
    this.models = HF_CONFIG.models;
  }

  /**
   * Check if Hugging Face API is properly configured
   */
  isConfigured(): boolean {
    return this.apiKey !== '' && this.apiKey !== 'your_huggingface_api_key_here';
  }

  /**
   * Get all available models organized by category
   */
  getAvailableModels(): HFModelInfo[] {
    const models: HFModelInfo[] = [];
    
    Object.entries(this.models).forEach(([category, modelMap]) => {
      Object.entries(modelMap).forEach(([name, description]) => {
        models.push({
          name,
          description,
          category: category as 'textGeneration' | 'codeGeneration' | 'businessAnalysis'
        });
      });
    });
    
    return models;
  }

  /**
   * Send a message to a specific Hugging Face model
   */
  async sendMessage(
    model: string,
    message: string,
    systemPrompt?: string,
    conversationHistory: HFMessage[] = []
  ): Promise<HFResponse> {
    if (!this.isConfigured()) {
      throw new Error('Hugging Face API is not configured. Please set VITE_HUGGINGFACE_API_KEY in your environment variables.');
    }

    try {
      // Prepare the input text
      let inputText = message;
      
      // Add system prompt if provided
      if (systemPrompt) {
        inputText = `${systemPrompt}\n\n${message}`;
      }
      
      // Add conversation history
      if (conversationHistory.length > 0) {
        const historyText = conversationHistory
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        inputText = `${historyText}\n\n${inputText}`;
      }

      const response = await fetch(`${this.baseUrl}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: inputText,
          parameters: {
            max_length: 200,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Hugging Face API Error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();

      // Handle different response formats
      let content: string;
      if (Array.isArray(data) && data.length > 0) {
        content = data[0].generated_text || data[0].text || '';
      } else if (data.generated_text) {
        content = data.generated_text;
      } else if (data.text) {
        content = data.text;
      } else {
        content = JSON.stringify(data);
      }

      return {
        content: content.trim(),
        model: model,
        provider: 'huggingface',
        usage: data.usage || {}
      };
    } catch (error) {
      console.error('Hugging Face API Error:', error);
      throw new Error(`Failed to get response from ${model}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get agent recommendations using Hugging Face models
   */
  async getAgentRecommendations(
    model: string,
    systemMetrics: any
  ): Promise<string> {
    const systemPrompt = `You are an AI advisor for the IZA OS autonomous agent system. 
    Analyze the current system metrics and provide recommendations for optimizing agent performance, 
    resource allocation, and strategic decisions. Focus on actionable insights that can improve 
    the autonomous venture studio operations.`;

    const message = `Based on the current system metrics: ${JSON.stringify(systemMetrics, null, 2)}, 
    please provide strategic recommendations for optimizing our autonomous agent ecosystem.`;

    const response = await this.sendMessage(model, message, systemPrompt);
    return response.content;
  }

  /**
   * Analyze agent performance using Hugging Face models
   */
  async analyzeAgentPerformance(
    model: string,
    agentData: any
  ): Promise<string> {
    const systemPrompt = `You are a performance analyst for autonomous AI agents. 
    Analyze agent performance data and provide specific recommendations for improvement, 
    including optimization strategies, resource allocation, and potential bottlenecks.`;

    const message = `Please analyze this agent performance data and provide recommendations: 
    ${JSON.stringify(agentData, null, 2)}`;

    const response = await this.sendMessage(model, message, systemPrompt);
    return response.content;
  }

  /**
   * Generate strategic insights using Hugging Face models
   */
  async generateStrategicInsights(
    model: string,
    businessMetrics: any
  ): Promise<string> {
    const systemPrompt = `You are a strategic advisor for an autonomous venture studio. 
    Analyze business metrics and market data to provide insights on growth opportunities, 
    market positioning, and strategic initiatives. Focus on actionable recommendations 
    that can drive revenue and ecosystem value.`;

    const message = `Based on these business metrics: ${JSON.stringify(businessMetrics, null, 2)}, 
    please provide strategic insights and recommendations for growing our autonomous venture studio.`;

    const response = await this.sendMessage(model, message, systemPrompt);
    return response.content;
  }

  /**
   * Generate code using specialized code models
   */
  async generateCode(
    model: string,
    prompt: string,
    context?: string
  ): Promise<string> {
    const systemPrompt = `You are a code generation assistant for the IZA OS autonomous agent system. 
    Generate clean, efficient, and well-documented code based on the requirements.`;

    const message = context 
      ? `Context: ${context}\n\nGenerate code for: ${prompt}`
      : `Generate code for: ${prompt}`;

    const response = await this.sendMessage(model, message, systemPrompt);
    return response.content;
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { 
    configured: boolean; 
    availableModels: number;
    categories: string[];
  } {
    const models = this.getAvailableModels();
    return {
      configured: this.isConfigured(),
      availableModels: models.length,
      categories: [...new Set(models.map(m => m.category))]
    };
  }
}

// Export singleton instance
export const huggingFaceService = new HuggingFaceService();

// Export configuration for display
export const huggingFaceConfig = HF_CONFIG;
