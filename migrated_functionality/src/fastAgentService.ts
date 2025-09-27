// Fast-Agent Integration for IZA OS
// Define, Prompt and Test MCP enabled Agents and Workflows

// Constants for default values and configuration
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022'
const DEFAULT_BASE_URL = 'http://localhost:8002'
const DEFAULT_TTL_HOURS = 24 // TTL for in-memory cache entries
const MAX_CACHE_SIZE = 1000 // Maximum entries per cache

interface FastAgentConfig {
  baseUrl: string
  apiKey?: string
  anthropicApiKey?: string
  openaiApiKey?: string
  googleApiKey?: string
  azureApiKey?: string
  ollamaUrl?: string
  deepseekApiKey?: string
}

interface Agent {
  id: string
  name: string
  instruction: string
  model: string
  servers: string[]
  useHistory: boolean
  humanInput: boolean
  requestParams: {
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
  status: 'active' | 'inactive' | 'training' | 'error'
  createdAt: string
  lastUsed: string
  performance: {
    responseTime: number
    accuracy: number
    userSatisfaction: number
  }
}

interface Workflow {
  id: string
  name: string
  type: 'chain' | 'parallel' | 'evaluator_optimizer' | 'router' | 'orchestrator'
  instruction: string
  agents: string[]
  config: {
    sequence?: string[]
    fanOut?: string[]
    fanIn?: string
    generator?: string
    evaluator?: string
    minRating?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
    maxRefinements?: number
    cumulative?: boolean
    continueWithFinal?: boolean
    includeRequest?: boolean
    planType?: 'full' | 'iterative'
    planIterations?: number
  }
  status: 'active' | 'inactive' | 'running' | 'error'
  createdAt: string
  lastExecuted: string
  executionCount: number
  averageExecutionTime: number
}

interface MCPServer {
  id: string
  name: string
  command: string
  args: string[]
  description: string
  capabilities: {
    tools: string[]
    resources: string[]
    prompts: string[]
  }
  status: 'running' | 'stopped' | 'error'
  lastHealthCheck: string
  sampling?: {
    model: string
    enabled: boolean
  }
}

// API Response Types
interface AgentResponse {
  id: string
  name: string
  instruction: string
  model: string
  servers: string[]
  use_history: boolean
  human_input: boolean
  request_params: {
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
  }
  status: 'active' | 'inactive' | 'training' | 'error'
  created_at: string
  last_used: string
  performance: {
    response_time: number
    accuracy: number
    user_satisfaction: number
  }
}

interface ExecutionResponse {
  id: string
  workflow_id: string
  agent_id?: string
  input: string
  output: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string
  completed_at?: string
  execution_time: number
  tokens_used: number
  cost: number
  metadata: {
    model: string
    temperature: number
    max_tokens: number
  }
}

interface MCPServerResponse {
  id: string
  name: string
  command: string
  args: string[]
  description: string
  capabilities: {
    tools?: string[]
    resources?: string[]
    prompts?: string[]
  }
  status: 'running' | 'stopped' | 'error'
  last_health_check: string
  sampling?: {
    model: string
    enabled: boolean
  }
}

interface ResourceResponse {
  id: string
  name: string
  type: 'image' | 'pdf' | 'text' | 'url' | 'file'
  content: string
  metadata: {
    size: number
    format: string
    mime_type: string
  }
  created_at: string
}

interface Execution {
  id: string
  workflowId: string
  agentId?: string
  input: string
  output: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  executionTime: number
  tokensUsed: number
  cost: number
  metadata: {
    model: string
    temperature: number
    maxTokens: number
  }
}

interface Resource {
  id: string
  name: string
  type: 'image' | 'pdf' | 'text' | 'url' | 'file'
  content: string
  metadata: {
    size: number
    format: string
    mimeType: string
  }
  createdAt: string
}

// Cache entry with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
  lastAccessed: number
}

class FastAgentService {
  private config: FastAgentConfig
  private agents: Map<string, CacheEntry<Agent>> = new Map()
  private workflows: Map<string, CacheEntry<Workflow>> = new Map()
  private mcpServers: Map<string, CacheEntry<MCPServer>> = new Map()
  private executions: Map<string, CacheEntry<Execution>> = new Map()
  private resources: Map<string, CacheEntry<Resource>> = new Map()
  private cleanupInterval?: NodeJS.Timeout

  constructor() {
    this.config = {
      baseUrl: DEFAULT_BASE_URL // Fast-Agent API server
    }
    this.startCleanupInterval()
  }

  // Central helper function for fetch response validation and JSON parsing
  private async validateAndParseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
    }

    try {
      return await response.json()
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Utility function to transform camelCase to snake_case
  private toSnakeCase(obj: Record<string, any>): Record<string, any> {
    const transformed: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        transformed[snakeKey] = this.toSnakeCase(value)
      } else {
        transformed[snakeKey] = value
      }
    }
    
    return transformed
  }

  // Shared utility function for mapping API responses to Execution objects
  private mapExecutionResponse(data: ExecutionResponse, agentId?: string, input?: string): Execution {
    return {
      id: data.id,
      workflowId: data.workflow_id,
      agentId: agentId || data.agent_id,
      input: input || data.input,
      output: data.output,
      status: data.status,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      executionTime: data.execution_time,
      tokensUsed: data.tokens_used,
      cost: data.cost,
      metadata: {
        model: data.metadata?.model || DEFAULT_MODEL,
        temperature: data.metadata?.temperature || 0.7,
        maxTokens: data.metadata?.max_tokens || 4096
      }
    }
  }

  // Memory cleanup and eviction strategy
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries()
      this.evictOldEntries()
    }, 60 * 60 * 1000) // Run every hour
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now()
    const ttlMs = DEFAULT_TTL_HOURS * 60 * 60 * 1000

    // Clean up expired entries from all caches
    this.cleanupCacheEntries(this.agents, now, ttlMs)
    this.cleanupCacheEntries(this.workflows, now, ttlMs)
    this.cleanupCacheEntries(this.mcpServers, now, ttlMs)
    this.cleanupCacheEntries(this.executions, now, ttlMs)
    this.cleanupCacheEntries(this.resources, now, ttlMs)
  }

  private cleanupCacheEntries<T>(cache: Map<string, CacheEntry<T>>, now: number, ttlMs: number): void {
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttlMs) {
        cache.delete(key)
      }
    }
  }

  private evictOldEntries(): void {
    // Evict least recently accessed entries if cache is too large
    this.evictCacheEntries(this.agents)
    this.evictCacheEntries(this.workflows)
    this.evictCacheEntries(this.mcpServers)
    this.evictCacheEntries(this.executions)
    this.evictCacheEntries(this.resources)
  }

  private evictCacheEntries<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries())
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
      
      const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE)
      for (const [key] of toRemove) {
        cache.delete(key)
      }
    }
  }

  private updateCacheEntry<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    })
  }

  private getCacheEntry<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
    const entry = cache.get(key)
    if (entry) {
      entry.lastAccessed = Date.now()
      return entry.data
    }
    return undefined
  }

  // Input validation helper
  private validateRequiredInput(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName} is required and cannot be empty`)
    }
  }

  // Cleanup on service destruction
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
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

  // Agent Management
  async createAgent(config: {
    name: string
    instruction: string
    model?: string
    servers?: string[]
    useHistory?: boolean
    humanInput?: boolean
    requestParams?: {
      temperature?: number
      maxTokens?: number
      topP?: number
      frequencyPenalty?: number
      presencePenalty?: number
    }
  }): Promise<Agent> {
    try {
      // Input validation
      this.validateRequiredInput(config.name, 'Agent name')
      this.validateRequiredInput(config.instruction, 'Agent instruction')

      const payload = this.toSnakeCase({
        name: config.name,
        instruction: config.instruction,
        model: config.model || DEFAULT_MODEL,
        servers: config.servers || [],
        useHistory: config.useHistory ?? true,
        humanInput: config.humanInput ?? false,
        requestParams: config.requestParams || {}
      })

      const response = await fetch(`${this.config.baseUrl}/api/v1/agents`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      })

      const data = await this.validateAndParseResponse<AgentResponse>(response)
      const agent: Agent = {
        id: data.id,
        name: config.name,
        instruction: config.instruction,
        model: config.model || DEFAULT_MODEL,
        servers: config.servers || [],
        useHistory: config.useHistory ?? true,
        humanInput: config.humanInput ?? false,
        requestParams: config.requestParams || {},
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        performance: {
          responseTime: 0,
          accuracy: 0,
          userSatisfaction: 0
        }
      }

      this.updateCacheEntry(this.agents, agent.id, agent)
      return agent
    } catch (error) {
      console.error('Error creating agent:', error)
      throw error
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/agents`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await this.validateAndParseResponse<{ agents: AgentResponse[] }>(response)
      // Transform AgentResponse to Agent
      return (data.agents || []).map(agentResponse => ({
        id: agentResponse.id,
        name: agentResponse.name,
        instruction: agentResponse.instruction,
        model: agentResponse.model,
        servers: agentResponse.servers,
        useHistory: agentResponse.use_history,
        humanInput: agentResponse.human_input,
        requestParams: {
          temperature: agentResponse.request_params?.temperature,
          maxTokens: agentResponse.request_params?.max_tokens,
          topP: agentResponse.request_params?.top_p,
          frequencyPenalty: agentResponse.request_params?.frequency_penalty,
          presencePenalty: agentResponse.request_params?.presence_penalty
        },
        status: agentResponse.status,
        createdAt: agentResponse.created_at,
        lastUsed: agentResponse.last_used,
        performance: {
          responseTime: agentResponse.performance?.response_time || 0,
          accuracy: agentResponse.performance?.accuracy || 0,
          userSatisfaction: agentResponse.performance?.user_satisfaction || 0
        }
      }))
    } catch (error) {
      console.error('Error fetching agents:', error)
      return Array.from(this.agents.values()).map(entry => entry.data)
    }
  }

  async executeAgent(agentId: string, message: string): Promise<Execution> {
    try {
      // Input validation
      this.validateRequiredInput(agentId, 'Agent ID')
      this.validateRequiredInput(message, 'Message')

      const response = await fetch(`${this.config.baseUrl}/api/v1/agents/${agentId}/execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message })
      })

      const data = await this.validateAndParseResponse<ExecutionResponse>(response)
      const execution = this.mapExecutionResponse(data, agentId, message)

      this.updateCacheEntry(this.executions, execution.id, execution)
      
      // Update agent performance
      const agentEntry = this.getCacheEntry(this.agents, agentId)
      if (agentEntry) {
        agentEntry.lastUsed = new Date().toISOString()
        agentEntry.performance.responseTime = execution.executionTime
        this.updateCacheEntry(this.agents, agentId, agentEntry)
      }

      return execution
    } catch (error) {
      console.error(`Error executing agent ${agentId}:`, error)
      throw error
    }
  }

  // Workflow Management
  async createWorkflow(config: {
    name: string
    type: 'chain' | 'parallel' | 'evaluator_optimizer' | 'router' | 'orchestrator'
    instruction: string
    agents: string[]
    config: any
  }): Promise<Workflow> {
    try {
      // Input validation
      this.validateRequiredInput(config.name, 'Workflow name')
      this.validateRequiredInput(config.type, 'Workflow type')
      this.validateRequiredInput(config.instruction, 'Workflow instruction')
      this.validateRequiredInput(config.agents, 'Workflow agents')

      const payload = this.toSnakeCase({
        name: config.name,
        type: config.type,
        instruction: config.instruction,
        agents: config.agents,
        config: config.config
      })

      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      })

      const data = await this.validateAndParseResponse<{ id: string }>(response)
      const workflow: Workflow = {
        id: data.id,
        name: config.name,
        type: config.type,
        instruction: config.instruction,
        agents: config.agents,
        config: config.config,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastExecuted: new Date().toISOString(),
        executionCount: 0,
        averageExecutionTime: 0
      }

      this.updateCacheEntry(this.workflows, workflow.id, workflow)
      return workflow
    } catch (error) {
      console.error('Error creating workflow:', error)
      throw error
    }
  }

  async executeWorkflow(workflowId: string, input: string): Promise<Execution> {
    try {
      // Input validation
      this.validateRequiredInput(workflowId, 'Workflow ID')
      this.validateRequiredInput(input, 'Input')

      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ input })
      })

      const data = await this.validateAndParseResponse<ExecutionResponse>(response)
      const execution = this.mapExecutionResponse(data, undefined, input)
      execution.workflowId = workflowId

      this.updateCacheEntry(this.executions, execution.id, execution)
      
      // Update workflow statistics
      const workflowEntry = this.getCacheEntry(this.workflows, workflowId)
      if (workflowEntry) {
        workflowEntry.lastExecuted = new Date().toISOString()
        workflowEntry.executionCount += 1
        workflowEntry.averageExecutionTime = 
          (workflowEntry.averageExecutionTime * (workflowEntry.executionCount - 1) + execution.executionTime) / workflowEntry.executionCount
        this.updateCacheEntry(this.workflows, workflowId, workflowEntry)
      }

      return execution
    } catch (error) {
      console.error(`Error executing workflow ${workflowId}:`, error)
      throw error
    }
  }

  // MCP Server Management
  async registerMCPServer(config: {
    name: string
    command: string
    args: string[]
    description: string
    sampling?: {
      model: string
      enabled: boolean
    }
  }): Promise<MCPServer> {
    try {
      // Input validation
      this.validateRequiredInput(config.name, 'Server name')
      this.validateRequiredInput(config.command, 'Server command')
      this.validateRequiredInput(config.description, 'Server description')

      const payload = this.toSnakeCase({
        name: config.name,
        command: config.command,
        args: config.args,
        description: config.description,
        sampling: config.sampling
      })

      const response = await fetch(`${this.config.baseUrl}/api/v1/mcp-servers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      })

      const data = await this.validateAndParseResponse<MCPServerResponse>(response)
      const server: MCPServer = {
        id: data.id,
        name: config.name,
        command: config.command,
        args: config.args,
        description: config.description,
        capabilities: {
          tools: data.capabilities?.tools || [],
          resources: data.capabilities?.resources || [],
          prompts: data.capabilities?.prompts || []
        },
        status: 'running',
        lastHealthCheck: new Date().toISOString(),
        sampling: config.sampling
      }

      this.updateCacheEntry(this.mcpServers, server.id, server)
      return server
    } catch (error) {
      console.error('Error registering MCP server:', error)
      throw error
    }
  }

  async getMCPServers(): Promise<MCPServer[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/mcp-servers`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await this.validateAndParseResponse<{ servers: MCPServerResponse[] }>(response)
      // Transform MCPServerResponse to MCPServer
      return (data.servers || []).map(serverResponse => ({
        id: serverResponse.id,
        name: serverResponse.name,
        command: serverResponse.command,
        args: serverResponse.args,
        description: serverResponse.description,
        capabilities: {
          tools: serverResponse.capabilities?.tools || [],
          resources: serverResponse.capabilities?.resources || [],
          prompts: serverResponse.capabilities?.prompts || []
        },
        status: serverResponse.status,
        lastHealthCheck: serverResponse.last_health_check,
        sampling: serverResponse.sampling
      }))
    } catch (error) {
      console.error('Error fetching MCP servers:', error)
      return Array.from(this.mcpServers.values()).map(entry => entry.data)
    }
  }

  // Resource Management
  async uploadResource(
    file: File | Buffer | NodeJS.ReadableStream, 
    type: 'image' | 'pdf' | 'text',
    filename?: string
  ): Promise<Resource> {
    try {
      // Input validation
      this.validateRequiredInput(file, 'File')
      this.validateRequiredInput(type, 'Resource type')

      const formData = new FormData()
      
      // Handle different input types
      if (file instanceof File) {
        formData.append('file', file)
      } else if (Buffer.isBuffer(file)) {
        // Node.js Buffer - convert to ArrayBuffer for Blob compatibility
        const arrayBuffer = file.buffer instanceof ArrayBuffer 
          ? file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
          : new ArrayBuffer(file.byteLength)
        const blob = new Blob([arrayBuffer])
        formData.append('file', blob, filename || 'upload.bin')
      } else if (file && typeof file === 'object' && 'read' in file) {
        // Node.js ReadableStream - convert to Buffer first
        const chunks: Buffer[] = []
        for await (const chunk of file as NodeJS.ReadableStream) {
          chunks.push(Buffer.from(chunk))
        }
        const buffer = Buffer.concat(chunks)
        const blob = new Blob([buffer])
        formData.append('file', blob, filename || 'upload.bin')
      } else {
        throw new Error('Unsupported file type. Expected File, Buffer, or ReadableStream')
      }
      
      formData.append('type', type)

      const response = await fetch(`${this.config.baseUrl}/api/v1/resources`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData
      })

      const data = await this.validateAndParseResponse<ResourceResponse>(response)
      const resource: Resource = {
        id: data.id,
        name: data.name,
        type: type,
        content: data.content,
        metadata: {
          size: data.metadata?.size || 0,
          format: data.metadata?.format || 'unknown',
          mimeType: data.metadata?.mime_type || 'application/octet-stream'
        },
        createdAt: new Date().toISOString()
      }

      this.updateCacheEntry(this.resources, resource.id, resource)
      return resource
    } catch (error) {
      console.error('Error uploading resource:', error)
      throw error
    }
  }

  async executeWithResource(agentId: string, message: string, resourceId: string): Promise<Execution> {
    try {
      // Input validation
      this.validateRequiredInput(agentId, 'Agent ID')
      this.validateRequiredInput(message, 'Message')
      this.validateRequiredInput(resourceId, 'Resource ID')

      const payload = this.toSnakeCase({
        message,
        resourceId
      })

      const response = await fetch(`${this.config.baseUrl}/api/v1/agents/${agentId}/execute-with-resource`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      })

      const data = await this.validateAndParseResponse<ExecutionResponse>(response)
      const execution = this.mapExecutionResponse(data, agentId, message)

      this.updateCacheEntry(this.executions, execution.id, execution)
      return execution
    } catch (error) {
      console.error(`Error executing agent with resource ${agentId}:`, error)
      throw error
    }
  }

  // IZA OS Specific Agents
  async createIZAOSAgents(): Promise<Agent[]> {
    const agents = [
      {
        name: 'IZA OS CEO Agent',
        instruction: 'You are the CEO of IZA OS, an autonomous venture studio. Provide strategic leadership, business insights, and executive decision-making for the ecosystem.',
        model: DEFAULT_MODEL,
        servers: ['filesystem', 'web_search', 'business_intelligence'],
        useHistory: true,
        humanInput: true
      },
      {
        name: 'IZA OS CTO Agent',
        instruction: 'You are the CTO of IZA OS. Provide technical leadership, architecture decisions, and technology strategy for the ecosystem.',
        model: DEFAULT_MODEL,
        servers: ['filesystem', 'github', 'docker', 'kubernetes'],
        useHistory: true,
        humanInput: true
      },
      {
        name: 'IZA OS CFO Agent',
        instruction: 'You are the CFO of IZA OS. Provide financial analysis, budget planning, and investment recommendations for the ecosystem.',
        model: DEFAULT_MODEL,
        servers: ['filesystem', 'financial_data', 'market_analysis'],
        useHistory: true,
        humanInput: true
      },
      {
        name: 'IZA OS Designer Agent',
        instruction: 'You are the Creative Director of IZA OS. Provide design strategy, UI/UX guidance, and creative direction for the ecosystem.',
        model: DEFAULT_MODEL,
        servers: ['filesystem', 'image_generation', 'design_tools'],
        useHistory: true,
        humanInput: true
      },
      {
        name: 'IZA OS Healthcare Agent',
        instruction: 'You are the Healthcare Director of IZA OS. Provide medical insights, health technology guidance, and healthcare strategy.',
        model: DEFAULT_MODEL,
        servers: ['filesystem', 'medical_database', 'health_analytics'],
        useHistory: true,
        humanInput: true
      },
      {
        name: 'IZA OS Maestro Agent',
        instruction: 'You are the Maestro Orchestrator of IZA OS. Coordinate all 1,842 agents, manage workflows, and ensure optimal system performance.',
        model: DEFAULT_MODEL,
        servers: ['filesystem', 'agent_coordination', 'workflow_management'],
        useHistory: true,
        humanInput: false
      }
    ]

    // Create agents in parallel using Promise.allSettled
    const agentCreationPromises = agents.map(agentConfig => 
      this.createAgent(agentConfig)
    )

    const results = await Promise.allSettled(agentCreationPromises)
    const createdAgents: Agent[] = []
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        createdAgents.push(result.value)
      } else {
        console.error(`Error creating ${agents[index].name}:`, result.reason)
      }
    })

    return createdAgents
  }

  // IZA OS Specific Workflows
  async createIZAOSWorkflows(): Promise<Workflow[]> {
    // First, get all agents to map names to IDs
    const agents = await this.getAgents()
    const agentNameToId = new Map<string, string>()
    
    for (const agent of agents) {
      agentNameToId.set(agent.name, agent.id)
    }

    const workflows = [
      {
        name: 'IZA OS Strategic Planning Chain',
        type: 'chain' as const,
        instruction: 'Execute strategic planning workflow for IZA OS ecosystem',
        agentNames: ['IZA OS CEO Agent', 'IZA OS CTO Agent', 'IZA OS CFO Agent'],
        config: {
          sequence: ['IZA OS CEO Agent', 'IZA OS CTO Agent', 'IZA OS CFO Agent'],
          cumulative: true,
          continueWithFinal: true
        }
      },
      {
        name: 'IZA OS Multi-Agent Analysis',
        type: 'parallel' as const,
        instruction: 'Run parallel analysis across multiple IZA OS agents',
        agentNames: ['IZA OS CEO Agent', 'IZA OS CTO Agent', 'IZA OS CFO Agent', 'IZA OS Designer Agent'],
        config: {
          fanOut: ['IZA OS CEO Agent', 'IZA OS CTO Agent', 'IZA OS CFO Agent', 'IZA OS Designer Agent'],
          fanIn: 'IZA OS Maestro Agent',
          includeRequest: true
        }
      },
      {
        name: 'IZA OS Content Optimizer',
        type: 'evaluator_optimizer' as const,
        instruction: 'Optimize content quality through iterative improvement',
        agentNames: ['IZA OS Designer Agent', 'IZA OS CEO Agent'],
        config: {
          generator: 'IZA OS Designer Agent',
          evaluator: 'IZA OS CEO Agent',
          minRating: 'EXCELLENT',
          maxRefinements: 3
        }
      },
      {
        name: 'IZA OS Task Router',
        type: 'router' as const,
        instruction: 'Route tasks to appropriate IZA OS agents based on content and requirements',
        agentNames: ['IZA OS CEO Agent', 'IZA OS CTO Agent', 'IZA OS CFO Agent', 'IZA OS Designer Agent', 'IZA OS Healthcare Agent'],
        config: {}
      },
      {
        name: 'IZA OS Ecosystem Orchestrator',
        type: 'orchestrator' as const,
        instruction: 'Orchestrate complex tasks across the entire IZA OS ecosystem',
        agentNames: ['IZA OS CEO Agent', 'IZA OS CTO Agent', 'IZA OS CFO Agent', 'IZA OS Designer Agent', 'IZA OS Healthcare Agent', 'IZA OS Maestro Agent'],
        config: {
          planType: 'iterative',
          planIterations: 5
        }
      }
    ]

    const createdWorkflows: Workflow[] = []
    
    for (const workflowConfig of workflows) {
      try {
        // Map agent names to IDs
        const agentIds: string[] = []
        for (const agentName of workflowConfig.agentNames) {
          const agentId = agentNameToId.get(agentName)
          if (agentId) {
            agentIds.push(agentId)
          } else {
            console.warn(`Agent '${agentName}' not found, skipping from workflow '${workflowConfig.name}'`)
          }
        }

        if (agentIds.length === 0) {
          console.error(`No valid agents found for workflow '${workflowConfig.name}', skipping`)
          continue
        }

        const workflow = await this.createWorkflow({
          name: workflowConfig.name,
          type: workflowConfig.type,
          instruction: workflowConfig.instruction,
          agents: agentIds,
          config: workflowConfig.config
        })
        createdWorkflows.push(workflow)
      } catch (error) {
        console.error(`Error creating ${workflowConfig.name}:`, error)
      }
    }

    return createdWorkflows
  }

  // System Statistics
  async getSystemStatistics(): Promise<{
    totalAgents: number
    activeAgents: number
    totalWorkflows: number
    activeWorkflows: number
    totalExecutions: number
    totalMCPServers: number
    totalResources: number
    averageExecutionTime: number
    totalTokensUsed: number
    totalCost: number
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await this.validateAndParseResponse<{
        total_agents?: number
        active_agents?: number
        total_workflows?: number
        active_workflows?: number
        total_executions?: number
        total_mcp_servers?: number
        total_resources?: number
        average_execution_time?: number
        total_tokens_used?: number
        total_cost?: number
      }>(response)
      return {
        totalAgents: data.total_agents || 0,
        activeAgents: data.active_agents || 0,
        totalWorkflows: data.total_workflows || 0,
        activeWorkflows: data.active_workflows || 0,
        totalExecutions: data.total_executions || 0,
        totalMCPServers: data.total_mcp_servers || 0,
        totalResources: data.total_resources || 0,
        averageExecutionTime: data.average_execution_time || 0,
        totalTokensUsed: data.total_tokens_used || 0,
        totalCost: data.total_cost || 0
      }
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      const agents = Array.from(this.agents.values())
      const workflows = Array.from(this.workflows.values())
      const executions = Array.from(this.executions.values())
      const servers = Array.from(this.mcpServers.values())
      const resources = Array.from(this.resources.values())

      const agentData = agents.map(entry => entry.data)
      const workflowData = workflows.map(entry => entry.data)
      const executionData = executions.map(entry => entry.data)
      const serverData = servers.map(entry => entry.data)
      const resourceData = resources.map(entry => entry.data)

      return {
        totalAgents: agentData.length,
        activeAgents: agentData.filter(a => a.status === 'active').length,
        totalWorkflows: workflowData.length,
        activeWorkflows: workflowData.filter(w => w.status === 'active').length,
        totalExecutions: executionData.length,
        totalMCPServers: serverData.length,
        totalResources: resourceData.length,
        averageExecutionTime: executionData.length > 0 
          ? executionData.reduce((sum, e) => sum + e.executionTime, 0) / executionData.length 
          : 0,
        totalTokensUsed: executionData.reduce((sum, e) => sum + e.tokensUsed, 0),
        totalCost: executionData.reduce((sum, e) => sum + e.cost, 0)
      }
    }
  }

  // System Overview
  async getSystemOverview(): Promise<{
    health: boolean
    totalAgents: number
    activeWorkflows: number
    totalExecutions: number
    averageExecutionTime: number
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
        totalAgents: statistics.totalAgents,
        activeWorkflows: statistics.activeWorkflows,
        totalExecutions: statistics.totalExecutions,
        averageExecutionTime: statistics.averageExecutionTime,
        systemResources: {
          // TODO: Replace with real system metrics integration
          // These are placeholder values due to unavailability of real system metrics
          // Future integration points: system monitoring APIs, Docker stats, Kubernetes metrics
          cpuUsage: 30, // Mock data - placeholder for real CPU usage percentage
          memoryUsage: 50, // Mock data - placeholder for real memory usage percentage
          diskUsage: 20 // Mock data - placeholder for real disk usage percentage
        }
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        totalAgents: 0,
        activeWorkflows: 0,
        totalExecutions: 0,
        averageExecutionTime: 0,
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

    // Security check: Only add API keys in server-side environments
    // In browser environments, these keys should be handled by secure backend calls
    const isServerSide = typeof window === 'undefined' || typeof process !== 'undefined'
    
    if (isServerSide) {
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
      }

      if (this.config.anthropicApiKey) {
        headers['X-Anthropic-API-Key'] = this.config.anthropicApiKey
      }

      if (this.config.openaiApiKey) {
        headers['X-OpenAI-API-Key'] = this.config.openaiApiKey
      }

      if (this.config.googleApiKey) {
        headers['X-Google-API-Key'] = this.config.googleApiKey
      }

      if (this.config.azureApiKey) {
        headers['X-Azure-API-Key'] = this.config.azureApiKey
      }

      if (this.config.ollamaUrl) {
        headers['X-Ollama-URL'] = this.config.ollamaUrl
      }

      if (this.config.deepseekApiKey) {
        headers['X-Deepseek-API-Key'] = this.config.deepseekApiKey
      }
    } else {
      // In client-side environments, warn about missing secure backend
      console.warn('FastAgentService: API keys are not included in client-side requests. Ensure secure backend proxy is configured.')
    }

    return headers
  }
}

// Export singleton instance and class for testing
export const fastAgentService = new FastAgentService()
export { FastAgentService }
export default fastAgentService
