/**
 * Qwen Service for IZA OS Dashboard
 * Integration with Qwen3-Next-80B-A3B-Instruct model
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface QwenChatResponse {
  model: string;
  response: string;
  timestamp: string;
}

export interface QwenCodeResponse {
  model: string;
  requirements: string;
  context?: string;
  generated_code: string;
  timestamp: string;
}

export interface QwenBusinessResponse {
  model: string;
  metrics: Record<string, any>;
  analysis: string;
  timestamp: string;
}

export interface QwenModelInfo {
  model_name: string;
  is_initialized: boolean;
  transformers_available: boolean;
  capabilities: string[];
  max_tokens: number;
  context_length: number;
  model_size: string;
  architecture: string;
  last_updated: string;
}

class QwenService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/qwen`;
  }

  /**
   * Chat with Qwen3-Next-80B-A3B-Instruct model
   */
  async chat(messages: QwenMessage[], maxTokens: number = 512): Promise<QwenChatResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/chat`, {
        messages,
        max_tokens: maxTokens
      });
      return response.data;
    } catch (error) {
      console.error('Qwen chat error:', error);
      throw new Error('Failed to chat with Qwen model');
    }
  }

  /**
   * Generate code using Qwen model
   */
  async generateCode(requirements: string, context?: string): Promise<QwenCodeResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/generate-code`, {
        requirements,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Qwen code generation error:', error);
      throw new Error('Failed to generate code with Qwen');
    }
  }

  /**
   * Analyze business metrics using Qwen model
   */
  async analyzeBusiness(metrics: Record<string, any>): Promise<QwenBusinessResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/analyze-business`, {
        metrics
      });
      return response.data;
    } catch (error) {
      console.error('Qwen business analysis error:', error);
      throw new Error('Failed to analyze business with Qwen');
    }
  }

  /**
   * Get Qwen model information and status
   */
  async getModelInfo(): Promise<QwenModelInfo> {
    try {
      const response = await axios.get(`${this.baseURL}/info`);
      return response.data;
    } catch (error) {
      console.error('Qwen model info error:', error);
      throw new Error('Failed to get Qwen model info');
    }
  }

  /**
   * Check if Qwen model is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const info = await this.getModelInfo();
      return info.is_initialized && info.transformers_available;
    } catch (error) {
      return false;
    }
  }
}

export const qwenService = new QwenService();
export default qwenService;

