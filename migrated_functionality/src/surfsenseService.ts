// SurfSense Integration for IZA OS
// Open Source Alternative to NotebookLM/Perplexity with Multi-Source Connectivity

interface SurfSenseConfig {
  baseUrl: string
  apiKey?: string
  pgvectorEnabled: boolean
  etlService: 'unstructured' | 'llamacloud' | 'docling'
}

interface Document {
  id: string
  title: string
  content: string
  source: string
  type: 'pdf' | 'docx' | 'txt' | 'html' | 'md' | 'csv' | 'xlsx' | 'pptx' | 'image' | 'audio' | 'video'
  uploadedAt: string
  processedAt?: string
  embedding?: number[]
  metadata: {
    size: number
    pages?: number
    language?: string
    tags: string[]
  }
}

interface SearchSpace {
  id: string
  name: string
  description: string
  documents: string[]
  createdAt: string
  lastAccessed: string
  settings: {
    hybridSearch: boolean
    reranking: boolean
    chunkSize: number
    overlap: number
  }
}

interface ResearchAgent {
  id: string
  name: string
  type: 'research' | 'analysis' | 'summarization' | 'qa'
  prompt: string
  sources: string[]
  status: 'active' | 'inactive' | 'training'
  performance: {
    accuracy: number
    speed: number
    relevance: number
  }
}

interface ExternalSource {
  id: string
  name: string
  type: 'slack' | 'linear' | 'jira' | 'clickup' | 'confluence' | 'notion' | 'youtube' | 'github' | 'discord' | 'search'
  status: 'connected' | 'disconnected' | 'error'
  lastSync: string
  documentsCount: number
  config: {
    apiKey?: string
    webhook?: string
    channels?: string[]
    repositories?: string[]
  }
}

interface SearchResult {
  id: string
  title: string
  content: string
  source: string
  score: number
  relevance: number
  metadata: {
    type: string
    size: number
    uploadedAt: string
  }
}

class SurfSenseService {
  private config: SurfSenseConfig
  private documents: Map<string, Document> = new Map()
  private searchSpaces: Map<string, SearchSpace> = new Map()
  private researchAgents: Map<string, ResearchAgent> = new Map()
  private externalSources: Map<string, ExternalSource> = new Map()

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:8000', // SurfSense backend default port
      pgvectorEnabled: true,
      etlService: 'unstructured'
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Document Management
  async uploadDocument(file: File, searchSpaceId?: string): Promise<Document> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (searchSpaceId) {
        formData.append('search_space_id', searchSpaceId)
      }

      const response = await fetch(`${this.config.baseUrl}/api/documents/upload`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData
      })

      const data = await response.json()
      const document: Document = {
        id: data.id,
        title: data.title,
        content: data.content,
        source: data.source,
        type: data.type,
        uploadedAt: new Date().toISOString(),
        processedAt: data.processed_at,
        embedding: data.embedding,
        metadata: {
          size: data.metadata.size,
          pages: data.metadata.pages,
          language: data.metadata.language,
          tags: data.metadata.tags || []
        }
      }

      this.documents.set(document.id, document)
      return document
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error
    }
  }

  async getDocuments(searchSpaceId?: string): Promise<Document[]> {
    try {
      const url = searchSpaceId 
        ? `${this.config.baseUrl}/api/documents?search_space_id=${searchSpaceId}`
        : `${this.config.baseUrl}/api/documents`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.documents || []
    } catch (error) {
      console.error('Error fetching documents:', error)
      return Array.from(this.documents.values())
    }
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (response.ok) {
        this.documents.delete(documentId)
        return true
      }
      return false
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error)
      return false
    }
  }

  // Search Spaces Management
  async createSearchSpace(config: {
    name: string
    description: string
    settings?: {
      hybridSearch?: boolean
      reranking?: boolean
      chunkSize?: number
      overlap?: number
    }
  }): Promise<SearchSpace> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/search-spaces`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          settings: {
            hybridSearch: config.settings?.hybridSearch ?? true,
            reranking: config.settings?.reranking ?? true,
            chunkSize: config.settings?.chunkSize ?? 1000,
            overlap: config.settings?.overlap ?? 200
          }
        })
      })

      const data = await response.json()
      const searchSpace: SearchSpace = {
        id: data.id,
        name: config.name,
        description: config.description,
        documents: [],
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        settings: {
          hybridSearch: config.settings?.hybridSearch ?? true,
          reranking: config.settings?.reranking ?? true,
          chunkSize: config.settings?.chunkSize ?? 1000,
          overlap: config.settings?.overlap ?? 200
        }
      }

      this.searchSpaces.set(searchSpace.id, searchSpace)
      return searchSpace
    } catch (error) {
      console.error('Error creating search space:', error)
      throw error
    }
  }

  async getSearchSpaces(): Promise<SearchSpace[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/search-spaces`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.search_spaces || []
    } catch (error) {
      console.error('Error fetching search spaces:', error)
      return Array.from(this.searchSpaces.values())
    }
  }

  // Hybrid Search
  async search(query: string, searchSpaceId?: string, options?: {
    limit?: number
    threshold?: number
    includeMetadata?: boolean
  }): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query,
          search_space_id: searchSpaceId,
          limit: options?.limit ?? 10,
          threshold: options?.threshold ?? 0.7,
          include_metadata: options?.includeMetadata ?? true
        })
      })

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Error performing search:', error)
      return []
    }
  }

  // Research Agents
  async createResearchAgent(config: {
    name: string
    type: 'research' | 'analysis' | 'summarization' | 'qa'
    prompt: string
    sources: string[]
  }): Promise<ResearchAgent> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/research-agents`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          type: config.type,
          prompt: config.prompt,
          sources: config.sources
        })
      })

      const data = await response.json()
      const agent: ResearchAgent = {
        id: data.id,
        name: config.name,
        type: config.type,
        prompt: config.prompt,
        sources: config.sources,
        status: 'active',
        performance: {
          accuracy: 0.85,
          speed: 0.90,
          relevance: 0.88
        }
      }

      this.researchAgents.set(agent.id, agent)
      return agent
    } catch (error) {
      console.error('Error creating research agent:', error)
      throw error
    }
  }

  async runResearchAgent(agentId: string, query: string): Promise<{
    response: string
    sources: string[]
    confidence: number
    executionTime: number
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/research-agents/${agentId}/run`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ query })
      })

      const data = await response.json()
      return {
        response: data.response,
        sources: data.sources,
        confidence: data.confidence,
        executionTime: data.execution_time
      }
    } catch (error) {
      console.error(`Error running research agent ${agentId}:`, error)
      throw error
    }
  }

  // External Sources Integration
  async connectExternalSource(config: {
    name: string
    type: 'slack' | 'linear' | 'jira' | 'clickup' | 'confluence' | 'notion' | 'youtube' | 'github' | 'discord' | 'search'
    apiKey?: string
    webhook?: string
    channels?: string[]
    repositories?: string[]
  }): Promise<ExternalSource> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/external-sources`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          type: config.type,
          config: {
            apiKey: config.apiKey,
            webhook: config.webhook,
            channels: config.channels,
            repositories: config.repositories
          }
        })
      })

      const data = await response.json()
      const source: ExternalSource = {
        id: data.id,
        name: config.name,
        type: config.type,
        status: 'connected',
        lastSync: new Date().toISOString(),
        documentsCount: 0,
        config: {
          apiKey: config.apiKey,
          webhook: config.webhook,
          channels: config.channels,
          repositories: config.repositories
        }
      }

      this.externalSources.set(source.id, source)
      return source
    } catch (error) {
      console.error('Error connecting external source:', error)
      throw error
    }
  }

  async syncExternalSource(sourceId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/external-sources/${sourceId}/sync`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const source = this.externalSources.get(sourceId)
        if (source) {
          source.lastSync = new Date().toISOString()
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error syncing external source ${sourceId}:`, error)
      return false
    }
  }

  // IZA OS Specific Research Spaces
  async createIZAOSResearchSpaces(): Promise<SearchSpace[]> {
    const spaces = [
      {
        name: 'IZA OS Business Intelligence',
        description: 'Research space for business strategy, market analysis, and competitive intelligence',
        settings: { hybridSearch: true, reranking: true, chunkSize: 1500 }
      },
      {
        name: 'IZA OS Technical Documentation',
        description: 'Technical documentation, API references, and development resources',
        settings: { hybridSearch: true, reranking: true, chunkSize: 2000 }
      },
      {
        name: 'IZA OS Financial Analysis',
        description: 'Financial reports, market data, and investment research',
        settings: { hybridSearch: true, reranking: true, chunkSize: 1000 }
      },
      {
        name: 'IZA OS Customer Insights',
        description: 'Customer feedback, support tickets, and user research',
        settings: { hybridSearch: true, reranking: true, chunkSize: 800 }
      }
    ]

    const createdSpaces: SearchSpace[] = []
    
    for (const spaceConfig of spaces) {
      try {
        const space = await this.createSearchSpace(spaceConfig)
        createdSpaces.push(space)
      } catch (error) {
        console.error(`Error creating ${spaceConfig.name}:`, error)
      }
    }

    return createdSpaces
  }

  // IZA OS Research Agents
  async createIZAOSResearchAgents(): Promise<ResearchAgent[]> {
    const agents = [
      {
        name: 'IZA OS Business Analyst',
        type: 'research' as const,
        prompt: 'Analyze business data and provide strategic insights for IZA OS ecosystem growth',
        sources: ['IZA OS Business Intelligence']
      },
      {
        name: 'IZA OS Technical Researcher',
        type: 'analysis' as const,
        prompt: 'Research technical solutions and provide implementation recommendations',
        sources: ['IZA OS Technical Documentation']
      },
      {
        name: 'IZA OS Financial Advisor',
        type: 'analysis' as const,
        prompt: 'Analyze financial data and provide investment and budget recommendations',
        sources: ['IZA OS Financial Analysis']
      },
      {
        name: 'IZA OS Customer Success Agent',
        type: 'qa' as const,
        prompt: 'Answer customer questions and provide support based on knowledge base',
        sources: ['IZA OS Customer Insights']
      }
    ]

    const createdAgents: ResearchAgent[] = []
    
    for (const agentConfig of agents) {
      try {
        const agent = await this.createResearchAgent(agentConfig)
        createdAgents.push(agent)
      } catch (error) {
        console.error(`Error creating ${agentConfig.name}:`, error)
      }
    }

    return createdAgents
  }

  // System Statistics
  async getSystemStatistics(): Promise<{
    totalDocuments: number
    totalSearchSpaces: number
    totalResearchAgents: number
    totalExternalSources: number
    totalStorageUsed: string
    averageSearchTime: number
    searchAccuracy: number
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return {
        totalDocuments: data.total_documents || 0,
        totalSearchSpaces: data.total_search_spaces || 0,
        totalResearchAgents: data.total_research_agents || 0,
        totalExternalSources: data.total_external_sources || 0,
        totalStorageUsed: data.total_storage_used || '0MB',
        averageSearchTime: data.average_search_time || 0,
        searchAccuracy: data.search_accuracy || 0
      }
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      return {
        totalDocuments: this.documents.size,
        totalSearchSpaces: this.searchSpaces.size,
        totalResearchAgents: this.researchAgents.size,
        totalExternalSources: this.externalSources.size,
        totalStorageUsed: '0MB',
        averageSearchTime: 0,
        searchAccuracy: 0
      }
    }
  }

  // System Overview
  async getSystemOverview(): Promise<{
    health: boolean
    pgvectorEnabled: boolean
    etlService: string
    totalDocuments: number
    activeAgents: number
    connectedSources: number
    systemResources: {
      cpuUsage: number
      memoryUsage: number
      diskUsage: number
    }
  }> {
    try {
      const [health, statistics] = await Promise.all([
        this.checkHealth(),
        this.getSystemStatistics()
      ])

      return {
        health,
        pgvectorEnabled: this.config.pgvectorEnabled,
        etlService: this.config.etlService,
        totalDocuments: statistics.totalDocuments,
        activeAgents: statistics.totalResearchAgents,
        connectedSources: statistics.totalExternalSources,
        systemResources: {
          cpuUsage: 45, // Mock data
          memoryUsage: 60,
          diskUsage: 25
        }
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        pgvectorEnabled: false,
        etlService: 'none',
        totalDocuments: 0,
        activeAgents: 0,
        connectedSources: 0,
        systemResources: {
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0
        }
      }
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    return headers
  }
}

// Export singleton instance
export const surfsenseService = new SurfSenseService()
export default surfsenseService
