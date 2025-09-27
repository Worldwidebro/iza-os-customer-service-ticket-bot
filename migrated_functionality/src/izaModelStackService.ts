/**
 * IZA OS Model Stack Service
 * Integration with IZA OS Hugging Face Model Stack
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface IZAModelRequest {
  prompt: string;
  model_type: string;
  max_tokens?: number;
  temperature?: number;
  context?: Record<string, any>;
}

export interface IZAModelResponse {
  content: string;
  model_name: string;
  model_type: string;
  description: string;
  tokens_used: number;
  cost: number;
  timestamp: string;
}

export interface IZAModel {
  name: string;
  endpoint: string;
  cost_per_token: number;
  description: string;
  category?: string;
}

export interface IZAModelsList {
  models: Record<string, IZAModel>;
  total_models: number;
  categories: string[];
  timestamp: string;
}

class IZAModelStackService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/iza-models`;
  }

  /**
   * Generate content using IZA OS model stack
   */
  async generate(request: IZAModelRequest): Promise<IZAModelResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/generate`, request);
      return response.data;
    } catch (error) {
      console.error('IZA model generation error:', error);
      throw new Error('Failed to generate content with IZA model');
    }
  }

  /**
   * List all available IZA OS models
   */
  async listModels(): Promise<IZAModelsList> {
    try {
      const response = await axios.get(`${this.baseURL}/list`);
      return response.data;
    } catch (error) {
      console.error('IZA models list error:', error);
      throw new Error('Failed to list IZA models');
    }
  }

  /**
   * Generate CEO-level strategic content
   */
  async generateCEOStrategy(prompt: string, context?: Record<string, any>): Promise<IZAModelResponse> {
    return this.generate({
      prompt,
      model_type: 'ceo',
      max_tokens: 1500,
      temperature: 0.7,
      context
    });
  }

  /**
   * Generate CTO-level technical content
   */
  async generateCTOTechnical(prompt: string, context?: Record<string, any>): Promise<IZAModelResponse> {
    return this.generate({
      prompt,
      model_type: 'cto',
      max_tokens: 2000,
      temperature: 0.5,
      context
    });
  }

  /**
   * Generate marketing content
   */
  async generateMarketing(prompt: string, context?: Record<string, any>): Promise<IZAModelResponse> {
    return this.generate({
      prompt,
      model_type: 'marketing',
      max_tokens: 1000,
      temperature: 0.8,
      context
    });
  }
}

export const izaModelStackService = new IZAModelStackService();
export default izaModelStackService;
