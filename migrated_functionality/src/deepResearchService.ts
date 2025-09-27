
import { ResearchRequest, ResearchResponse, ResearchMode } from '../types/deepResearch'

export class DeepResearchService {
  private config: DeepResearchConfig
  
  constructor(config: DeepResearchConfig) {
    this.config = config
  }
  
  async conductResearch(request: ResearchRequest): Promise<ResearchResponse> {
    try {
      const response = await fetch('/api/research/deep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })
      
      if (!response.ok) {
        throw new Error(`Research failed: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        answer: '',
        reasoningSteps: [],
        confidenceScore: 0
      }
    }
  }
  
  async batchResearch(requests: ResearchRequest[]): Promise<ResearchResponse[]> {
    try {
      const response = await fetch('/api/research/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      })
      
      if (!response.ok) {
        throw new Error(`Batch research failed: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      return requests.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        answer: '',
        reasoningSteps: [],
        confidenceScore: 0
      }))
    }
  }
}

interface DeepResearchConfig {
  modelPath: string
  maxContextLength: number
  temperature: number
  maxTokens: number
}
