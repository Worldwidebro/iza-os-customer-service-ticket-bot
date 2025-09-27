
import { TrainingRequest, TrainingResponse, ModelInfo, DatasetInfo } from '../types/llamafactory'

export class LLaMAFactoryService {
  private apiUrl: string
  
  constructor(apiUrl: string = 'http://localhost:7861') {
    this.apiUrl = apiUrl
  }
  
  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.apiUrl}/models`)
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching models:', error)
      return []
    }
  }
  
  async getDatasets(): Promise<DatasetInfo[]> {
    try {
      const response = await fetch(`${this.apiUrl}/datasets`)
      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching datasets:', error)
      return []
    }
  }
  
  async startTraining(request: TrainingRequest): Promise<TrainingResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })
      
      if (!response.ok) {
        throw new Error(`Training failed: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      return {
        success: false,
        jobId: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  async getTrainingStatus(jobId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/status/${jobId}`)
      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error getting training status:', error)
      return null
    }
  }
  
  async cancelTraining(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/cancel/${jobId}`, {
        method: 'POST'
      })
      return response.ok
    } catch (error) {
      console.error('Error cancelling training:', error)
      return false
    }
  }
  
  async downloadModel(jobId: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/download/${jobId}`)
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      return url
    } catch (error) {
      console.error('Error downloading model:', error)
      return ''
    }
  }
}
