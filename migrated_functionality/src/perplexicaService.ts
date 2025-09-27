
import { SearchRequest, SearchResponse, ChatRequest, ChatResponse } from '../types/perplexica'

export class PerplexicaService {
  private apiUrl: string
  
  constructor(apiUrl: string = 'http://localhost:3000/api') {
    this.apiUrl = apiUrl
  }
  
  async search(request: SearchRequest): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
        sources: []
      }
    }
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })
      
      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        answer: '',
        sources: []
      }
    }
  }
  
  async getSources(query: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/sources?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error(`Sources fetch failed: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching sources:', error)
      return []
    }
  }
}
