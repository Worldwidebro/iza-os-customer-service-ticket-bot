// MCP Registry Integration for IZA OS
// Community-driven registry service for Model Context Protocol (MCP) servers

interface MCPRegistryConfig {
  baseUrl: string
  apiKey?: string
  githubToken?: string
  namespace: string
}

interface MCPServer {
  id: string
  name: string
  description: string
  version: string
  namespace: string
  author: string
  repository?: string
  homepage?: string
  documentation?: string
  tags: string[]
  category: 'productivity' | 'development' | 'data' | 'ai' | 'communication' | 'utilities'
  status: 'published' | 'draft' | 'deprecated' | 'pending'
  publishedAt: string
  updatedAt: string
  downloads: number
  rating: number
  capabilities: {
    tools: string[]
    resources: string[]
    prompts: string[]
  }
  requirements: {
    nodeVersion?: string
    pythonVersion?: string
    dependencies: string[]
  }
  installation: {
    npm?: string
    pip?: string
    docker?: string
    manual?: string
  }
}

interface MCPNamespace {
  id: string
  name: string
  description: string
  owner: string
  type: 'github' | 'domain' | 'custom'
  verified: boolean
  servers: string[]
  createdAt: string
  lastActivity: string
}

interface MCPPublication {
  id: string
  serverId: string
  version: string
  status: 'pending' | 'approved' | 'rejected' | 'published'
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
  feedback?: string
  changelog: string[]
}

interface MCPSearchFilters {
  category?: string
  tags?: string[]
  author?: string
  namespace?: string
  status?: string
  minRating?: number
  minDownloads?: number
}

class MCPRegistryService {
  private config: MCPRegistryConfig
  private servers: Map<string, MCPServer> = new Map()
  private namespaces: Map<string, MCPNamespace> = new Map()
  private publications: Map<string, MCPPublication> = new Map()

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:8080', // MCP Registry default port
      namespace: 'iza-os'
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

  // Server Discovery
  async searchServers(query?: string, filters?: MCPSearchFilters): Promise<MCPServer[]> {
    try {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.tags) params.append('tags', filters.tags.join(','))
      if (filters?.author) params.append('author', filters.author)
      if (filters?.namespace) params.append('namespace', filters.namespace)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.minRating) params.append('min_rating', filters.minRating.toString())
      if (filters?.minDownloads) params.append('min_downloads', filters.minDownloads.toString())

      const response = await fetch(`${this.config.baseUrl}/api/v0/servers?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.servers || []
    } catch (error) {
      console.error('Error searching MCP servers:', error)
      return Array.from(this.servers.values())
    }
  }

  async getServer(serverId: string): Promise<MCPServer | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v0/servers/${serverId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.server
    } catch (error) {
      console.error(`Error fetching MCP server ${serverId}:`, error)
      return this.servers.get(serverId) || null
    }
  }

  async getPopularServers(limit: number = 10): Promise<MCPServer[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v0/servers/popular?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.servers || []
    } catch (error) {
      console.error('Error fetching popular MCP servers:', error)
      return Array.from(this.servers.values())
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, limit)
    }
  }

  async getRecentServers(limit: number = 10): Promise<MCPServer[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v0/servers/recent?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.servers || []
    } catch (error) {
      console.error('Error fetching recent MCP servers:', error)
      return Array.from(this.servers.values())
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, limit)
    }
  }

  // Server Publishing
  async publishServer(serverData: {
    name: string
    description: string
    version: string
    repository?: string
    homepage?: string
    documentation?: string
    tags: string[]
    category: string
    capabilities: {
      tools: string[]
      resources: string[]
      prompts: string[]
    }
    requirements: {
      nodeVersion?: string
      pythonVersion?: string
      dependencies: string[]
    }
    installation: {
      npm?: string
      pip?: string
      docker?: string
      manual?: string
    }
    changelog: string[]
  }): Promise<MCPPublication> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v0/servers/publish`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...serverData,
          namespace: this.config.namespace
        })
      })

      const data = await response.json()
      const publication: MCPPublication = {
        id: data.id,
        serverId: data.server_id,
        version: serverData.version,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        changelog: serverData.changelog
      }

      this.publications.set(publication.id, publication)
      return publication
    } catch (error) {
      console.error('Error publishing MCP server:', error)
      throw error
    }
  }

  async getPublications(): Promise<MCPPublication[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v0/publications`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.publications || []
    } catch (error) {
      console.error('Error fetching publications:', error)
      return Array.from(this.publications.values())
    }
  }

  // Namespace Management
  async createNamespace(config: {
    name: string
    description: string
    type: 'github' | 'domain' | 'custom'
    verificationMethod?: 'dns' | 'http' | 'github'
  }): Promise<MCPNamespace> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v0/namespaces`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          type: config.type,
          verification_method: config.verificationMethod
        })
      })

      const data = await response.json()
      const namespace: MCPNamespace = {
        id: data.id,
        name: config.name,
        description: config.description,
        owner: data.owner,
        type: config.type,
        verified: false,
        servers: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }

      this.namespaces.set(namespace.id, namespace)
      return namespace
    } catch (error) {
      console.error('Error creating namespace:', error)
      throw error
    }
  }

  async getNamespaces(): Promise<MCPNamespace[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v0/namespaces`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.namespaces || []
    } catch (error) {
      console.error('Error fetching namespaces:', error)
      return Array.from(this.namespaces.values())
    }
  }

  // IZA OS Specific MCP Servers
  async createIZAOSMCPServers(): Promise<MCPServer[]> {
    const servers = [
      {
        name: 'iza-os-business-intelligence',
        description: 'Business intelligence and analytics MCP server for IZA OS ecosystem',
        version: '1.0.0',
        tags: ['business', 'analytics', 'intelligence', 'iza-os'],
        category: 'ai' as const,
        capabilities: {
          tools: ['analyze_market', 'generate_report', 'predict_trends'],
          resources: ['market_data', 'financial_data', 'customer_data'],
          prompts: ['business_analysis', 'market_research', 'strategy_planning']
        },
        requirements: {
          dependencies: ['pandas', 'numpy', 'scikit-learn']
        },
        installation: {
          pip: 'pip install iza-os-business-intelligence'
        },
        changelog: ['Initial release with business intelligence capabilities']
      },
      {
        name: 'iza-os-agent-orchestrator',
        description: 'Agent orchestration and management MCP server for IZA OS',
        version: '1.0.0',
        tags: ['agents', 'orchestration', 'management', 'iza-os'],
        category: 'ai' as const,
        capabilities: {
          tools: ['deploy_agent', 'monitor_agent', 'coordinate_agents'],
          resources: ['agent_configs', 'workflow_templates', 'performance_metrics'],
          prompts: ['agent_deployment', 'workflow_optimization', 'performance_analysis']
        },
        requirements: {
          dependencies: ['asyncio', 'websockets', 'redis']
        },
        installation: {
          pip: 'pip install iza-os-agent-orchestrator'
        },
        changelog: ['Initial release with agent orchestration capabilities']
      },
      {
        name: 'iza-os-data-processor',
        description: 'Data processing and ETL MCP server for IZA OS',
        version: '1.0.0',
        tags: ['data', 'processing', 'etl', 'iza-os'],
        category: 'data' as const,
        capabilities: {
          tools: ['process_data', 'transform_data', 'load_data'],
          resources: ['data_schemas', 'transformation_rules', 'data_sources'],
          prompts: ['data_processing', 'schema_mapping', 'quality_assurance']
        },
        requirements: {
          dependencies: ['pandas', 'sqlalchemy', 'pydantic']
        },
        installation: {
          pip: 'pip install iza-os-data-processor'
        },
        changelog: ['Initial release with data processing capabilities']
      },
      {
        name: 'iza-os-workflow-automation',
        description: 'Workflow automation and orchestration MCP server for IZA OS',
        version: '1.0.0',
        tags: ['workflow', 'automation', 'orchestration', 'iza-os'],
        category: 'productivity' as const,
        capabilities: {
          tools: ['create_workflow', 'execute_workflow', 'monitor_workflow'],
          resources: ['workflow_templates', 'execution_logs', 'performance_metrics'],
          prompts: ['workflow_design', 'automation_planning', 'optimization']
        },
        requirements: {
          dependencies: ['celery', 'redis', 'sqlalchemy']
        },
        installation: {
          pip: 'pip install iza-os-workflow-automation'
        },
        changelog: ['Initial release with workflow automation capabilities']
      }
    ]

    const createdServers: MCPServer[] = []
    
    for (const serverConfig of servers) {
      try {
        const publication = await this.publishServer(serverConfig)
        // Simulate server creation
        const server: MCPServer = {
          id: publication.serverId,
          name: serverConfig.name,
          description: serverConfig.description,
          version: serverConfig.version,
          namespace: this.config.namespace,
          author: 'IZA OS Team',
          tags: serverConfig.tags,
          category: serverConfig.category,
          status: 'published',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          downloads: Math.floor(Math.random() * 1000),
          rating: 4.5 + Math.random() * 0.5,
          capabilities: serverConfig.capabilities,
          requirements: serverConfig.requirements,
          installation: serverConfig.installation
        }
        
        this.servers.set(server.id, server)
        createdServers.push(server)
      } catch (error) {
        console.error(`Error creating ${serverConfig.name}:`, error)
      }
    }

    return createdServers
  }

  // Server Installation
  async installServer(serverId: string, method: 'npm' | 'pip' | 'docker' | 'manual'): Promise<boolean> {
    try {
      const server = this.servers.get(serverId)
      if (!server) {
        throw new Error('Server not found')
      }

      const response = await fetch(`${this.config.baseUrl}/api/v0/servers/${serverId}/install`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ method })
      })

      if (response.ok) {
        server.downloads += 1
        return true
      }
      return false
    } catch (error) {
      console.error(`Error installing server ${serverId}:`, error)
      return false
    }
  }

  // System Statistics
  async getSystemStatistics(): Promise<{
    totalServers: number
    totalNamespaces: number
    totalPublications: number
    totalDownloads: number
    averageRating: number
    topCategories: { category: string; count: number }[]
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v0/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return {
        totalServers: data.total_servers || 0,
        totalNamespaces: data.total_namespaces || 0,
        totalPublications: data.total_publications || 0,
        totalDownloads: data.total_downloads || 0,
        averageRating: data.average_rating || 0,
        topCategories: data.top_categories || []
      }
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      const servers = Array.from(this.servers.values())
      const categories = servers.reduce((acc, server) => {
        acc[server.category] = (acc[server.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalServers: servers.length,
        totalNamespaces: this.namespaces.size,
        totalPublications: this.publications.size,
        totalDownloads: servers.reduce((sum, server) => sum + server.downloads, 0),
        averageRating: servers.reduce((sum, server) => sum + server.rating, 0) / servers.length || 0,
        topCategories: Object.entries(categories).map(([category, count]) => ({ category, count }))
      }
    }
  }

  // System Overview
  async getSystemOverview(): Promise<{
    health: boolean
    totalServers: number
    totalNamespaces: number
    totalDownloads: number
    averageRating: number
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
        totalServers: statistics.totalServers,
        totalNamespaces: statistics.totalNamespaces,
        totalDownloads: statistics.totalDownloads,
        averageRating: statistics.averageRating,
        systemResources: {
          cpuUsage: 35, // Mock data
          memoryUsage: 45,
          diskUsage: 20
        }
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        totalServers: 0,
        totalNamespaces: 0,
        totalDownloads: 0,
        averageRating: 0,
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

    if (this.config.githubToken) {
      headers['X-GitHub-Token'] = this.config.githubToken
    }

    return headers
  }
}

// Export singleton instance
export const mcpRegistryService = new MCPRegistryService()
export default mcpRegistryService
