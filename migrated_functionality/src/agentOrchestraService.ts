// AgentOrchestra Integration for IZA OS
// Hierarchical Multi-Agent Framework for General-Purpose Task Solving

import axios from 'axios';
import { toast } from 'react-hot-toast';

const AGENTORCHESTRA_API_BASE_URL = 'http://localhost:8087'; // AgentOrchestra API server

// Constants for default values and configuration
const DEFAULT_TTL_HOURS = 24;
const MAX_CACHE_SIZE = 1000;

interface AgentOrchestraConfig {
  baseUrl: string;
  apiKey?: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

interface PlanningAgent {
  id: string;
  name: string;
  role: 'planning' | 'research' | 'browser' | 'analysis' | 'tool_calling' | 'mcp_manager';
  status: 'active' | 'busy' | 'idle' | 'error';
  capabilities: string[];
  currentTask?: string;
  performance: {
    tasksCompleted: number;
    successRate: number;
    averageExecutionTime: number;
    lastUsed: string;
  };
  configuration: {
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
  };
}

interface Task {
  id: string;
  name: string;
  description: string;
  type: 'research' | 'analysis' | 'browser' | 'tool_calling' | 'planning' | 'mcp_management';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAgent?: string;
  input: any;
  output?: any;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  executionTime?: number;
  metadata: {
    depth?: number;
    sources?: string[];
    tools?: string[];
    errors?: string[];
  };
}

interface MCPTool {
  id: string;
  name: string;
  description: string;
  category: 'research' | 'analysis' | 'browser' | 'general' | 'custom';
  status: 'active' | 'inactive' | 'deprecated';
  version: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  usage: {
    totalCalls: number;
    successRate: number;
    averageExecutionTime: number;
    lastUsed: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ResearchResult {
  id: string;
  query: string;
  sources: Array<{
    title: string;
    url: string;
    content: string;
    relevanceScore: number;
    timestamp: string;
  }>;
  summary: string;
  keyInsights: string[];
  citations: string[];
  confidence: number;
  createdAt: string;
}

interface AnalysisResult {
  id: string;
  input: any;
  analysisType: 'text' | 'image' | 'audio' | 'video' | 'multimodal';
  results: {
    insights: string[];
    patterns: string[];
    recommendations: string[];
    confidence: number;
  };
  metadata: {
    models: string[];
    processingTime: number;
    dataSize: number;
  };
  createdAt: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
}

class AgentOrchestraService {
  private config: AgentOrchestraConfig;
  private agents: Map<string, CacheEntry<PlanningAgent>> = new Map();
  private tasks: Map<string, CacheEntry<Task>> = new Map();
  private mcpTools: Map<string, CacheEntry<MCPTool>> = new Map();
  private researchResults: Map<string, CacheEntry<ResearchResult>> = new Map();
  private analysisResults: Map<string, CacheEntry<AnalysisResult>> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.config = {
      baseUrl: AGENTORCHESTRA_API_BASE_URL,
      model: 'claude-3-5-sonnet-20241022',
      maxRetries: 3,
      timeout: 30000
    };
    this.startCleanupInterval();
  }

  // Central helper function for fetch response validation and JSON parsing
  private async validateAndParseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Memory cleanup and eviction strategy
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
      this.evictOldEntries();
    }, 60 * 60 * 1000); // Run every hour
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const ttlMs = DEFAULT_TTL_HOURS * 60 * 60 * 1000;

    this.cleanupCacheEntries(this.agents, now, ttlMs);
    this.cleanupCacheEntries(this.tasks, now, ttlMs);
    this.cleanupCacheEntries(this.mcpTools, now, ttlMs);
    this.cleanupCacheEntries(this.researchResults, now, ttlMs);
    this.cleanupCacheEntries(this.analysisResults, now, ttlMs);
  }

  private cleanupCacheEntries<T>(cache: Map<string, CacheEntry<T>>, now: number, ttlMs: number): void {
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttlMs) {
        cache.delete(key);
      }
    }
  }

  private evictOldEntries(): void {
    this.evictCacheEntries(this.agents);
    this.evictCacheEntries(this.tasks);
    this.evictCacheEntries(this.mcpTools);
    this.evictCacheEntries(this.researchResults);
    this.evictCacheEntries(this.analysisResults);
  }

  private evictCacheEntries<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
      for (const [key] of toRemove) {
        cache.delete(key);
      }
    }
  }

  private updateCacheEntry<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  private getCacheEntry<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
    const entry = cache.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      return entry.data;
    }
    return undefined;
  }

  // Input validation helper
  private validateRequiredInput(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName} is required and cannot be empty`);
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('AgentOrchestra health check failed:', error);
      return false;
    }
  }

  // 1. Agent Management
  async getAgents(): Promise<PlanningAgent[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/agents`);
      const data = await this.validateAndParseResponse<{ agents: PlanningAgent[] }>(response);
      
      // Cache the agents
      data.agents.forEach(agent => {
        this.updateCacheEntry(this.agents, agent.id, agent);
      });
      
      return data.agents;
    } catch (error) {
      console.error('Error fetching AgentOrchestra agents:', error);
      return Array.from(this.agents.values()).map(entry => entry.data);
    }
  }

  async getAgentStatus(agentId: string): Promise<PlanningAgent> {
    try {
      this.validateRequiredInput(agentId, 'Agent ID');

      const response = await fetch(`${this.config.baseUrl}/api/v1/agents/${agentId}`);
      const data = await this.validateAndParseResponse<PlanningAgent>(response);
      
      this.updateCacheEntry(this.agents, agentId, data);
      return data;
    } catch (error) {
      console.error(`Error fetching agent status for ${agentId}:`, error);
      const cached = this.getCacheEntry(this.agents, agentId);
      if (cached) return cached;
      throw error;
    }
  }

  // 2. Task Management
  async createTask(taskConfig: {
    name: string;
    description: string;
    type: 'research' | 'analysis' | 'browser' | 'tool_calling' | 'planning' | 'mcp_management';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    input: any;
    metadata?: any;
  }): Promise<Task> {
    try {
      this.validateRequiredInput(taskConfig.name, 'Task name');
      this.validateRequiredInput(taskConfig.description, 'Task description');
      this.validateRequiredInput(taskConfig.type, 'Task type');
      this.validateRequiredInput(taskConfig.input, 'Task input');

      const response = await fetch(`${this.config.baseUrl}/api/v1/tasks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: taskConfig.name,
          description: taskConfig.description,
          type: taskConfig.type,
          priority: taskConfig.priority || 'medium',
          input: taskConfig.input,
          metadata: taskConfig.metadata || {}
        })
      });

      const data = await this.validateAndParseResponse<Task>(response);
      this.updateCacheEntry(this.tasks, data.id, data);
      
      toast.success(`AgentOrchestra task '${taskConfig.name}' created successfully!`);
      return data;
    } catch (error) {
      console.error(`Error creating AgentOrchestra task '${taskConfig.name}':`, error);
      toast.error(`Failed to create AgentOrchestra task '${taskConfig.name}'.`);
      throw error;
    }
  }

  async executeTask(taskId: string): Promise<Task> {
    try {
      this.validateRequiredInput(taskId, 'Task ID');

      const response = await fetch(`${this.config.baseUrl}/api/v1/tasks/${taskId}/execute`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      const data = await this.validateAndParseResponse<Task>(response);
      this.updateCacheEntry(this.tasks, taskId, data);
      
      toast.success(`AgentOrchestra task '${taskId}' executed successfully!`);
      return data;
    } catch (error) {
      console.error(`Error executing AgentOrchestra task '${taskId}':`, error);
      toast.error(`Failed to execute AgentOrchestra task '${taskId}'.`);
      throw error;
    }
  }

  async getTaskStatus(taskId: string): Promise<Task> {
    try {
      this.validateRequiredInput(taskId, 'Task ID');

      const response = await fetch(`${this.config.baseUrl}/api/v1/tasks/${taskId}`);
      const data = await this.validateAndParseResponse<Task>(response);
      
      this.updateCacheEntry(this.tasks, taskId, data);
      return data;
    } catch (error) {
      console.error(`Error fetching task status for ${taskId}:`, error);
      const cached = this.getCacheEntry(this.tasks, taskId);
      if (cached) return cached;
      throw error;
    }
  }

  // 3. Deep Research Capabilities
  async conductDeepResearch(query: string, options?: {
    depth?: number;
    maxSources?: number;
    engines?: string[];
    timeout?: number;
  }): Promise<ResearchResult> {
    try {
      this.validateRequiredInput(query, 'Research query');

      const response = await fetch(`${this.config.baseUrl}/api/v1/research/deep`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query: query,
          depth: options?.depth || 3,
          maxSources: options?.maxSources || 10,
          engines: options?.engines || ['google', 'bing', 'duckduckgo'],
          timeout: options?.timeout || 300
        })
      });

      const data = await this.validateAndParseResponse<ResearchResult>(response);
      this.updateCacheEntry(this.researchResults, data.id, data);
      
      toast.success(`Deep research completed for query: '${query}'`);
      return data;
    } catch (error) {
      console.error(`Error conducting deep research for '${query}':`, error);
      toast.error(`Failed to conduct deep research for '${query}'.`);
      throw error;
    }
  }

  // 4. Deep Analysis Capabilities
  async performDeepAnalysis(input: any, analysisType: 'text' | 'image' | 'audio' | 'video' | 'multimodal'): Promise<AnalysisResult> {
    try {
      this.validateRequiredInput(input, 'Analysis input');
      this.validateRequiredInput(analysisType, 'Analysis type');

      const response = await fetch(`${this.config.baseUrl}/api/v1/analysis/deep`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          input: input,
          analysisType: analysisType,
          models: ['claude-3-5-sonnet', 'gpt-4o', 'gemini-pro'],
          timeout: 600
        })
      });

      const data = await this.validateAndParseResponse<AnalysisResult>(response);
      this.updateCacheEntry(this.analysisResults, data.id, data);
      
      toast.success(`Deep analysis completed for ${analysisType} input`);
      return data;
    } catch (error) {
      console.error(`Error performing deep analysis:`, error);
      toast.error(`Failed to perform deep analysis.`);
      throw error;
    }
  }

  // 5. Browser Automation
  async executeBrowserTask(task: {
    action: 'navigate' | 'click' | 'type' | 'extract' | 'screenshot' | 'scroll';
    target: string;
    parameters?: any;
    url?: string;
  }): Promise<any> {
    try {
      this.validateRequiredInput(task.action, 'Browser action');
      this.validateRequiredInput(task.target, 'Target');

      const response = await fetch(`${this.config.baseUrl}/api/v1/browser/execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: task.action,
          target: task.target,
          parameters: task.parameters || {},
          url: task.url
        })
      });

      const data = await this.validateAndParseResponse<any>(response);
      
      toast.success(`Browser task '${task.action}' executed successfully!`);
      return data;
    } catch (error) {
      console.error(`Error executing browser task '${task.action}':`, error);
      toast.error(`Failed to execute browser task '${task.action}'.`);
      throw error;
    }
  }

  // 6. MCP Tool Management
  async getMCPTools(category?: string): Promise<MCPTool[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`${this.config.baseUrl}/api/v1/mcp/tools?${params}`);
      const data = await this.validateAndParseResponse<{ tools: MCPTool[] }>(response);
      
      // Cache the tools
      data.tools.forEach(tool => {
        this.updateCacheEntry(this.mcpTools, tool.id, tool);
      });
      
      return data.tools;
    } catch (error) {
      console.error('Error fetching MCP tools:', error);
      return Array.from(this.mcpTools.values()).map(entry => entry.data);
    }
  }

  async createMCPTool(toolConfig: {
    name: string;
    description: string;
    category: 'research' | 'analysis' | 'browser' | 'general' | 'custom';
    parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
    implementation: string;
  }): Promise<MCPTool> {
    try {
      this.validateRequiredInput(toolConfig.name, 'Tool name');
      this.validateRequiredInput(toolConfig.description, 'Tool description');
      this.validateRequiredInput(toolConfig.implementation, 'Tool implementation');

      const response = await fetch(`${this.config.baseUrl}/api/v1/mcp/tools`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: toolConfig.name,
          description: toolConfig.description,
          category: toolConfig.category,
          parameters: toolConfig.parameters,
          implementation: toolConfig.implementation,
          version: '1.0.0'
        })
      });

      const data = await this.validateAndParseResponse<MCPTool>(response);
      this.updateCacheEntry(this.mcpTools, data.id, data);
      
      toast.success(`MCP tool '${toolConfig.name}' created successfully!`);
      return data;
    } catch (error) {
      console.error(`Error creating MCP tool '${toolConfig.name}':`, error);
      toast.error(`Failed to create MCP tool '${toolConfig.name}'.`);
      throw error;
    }
  }

  async executeMCPTool(toolId: string, parameters: Record<string, any>): Promise<any> {
    try {
      this.validateRequiredInput(toolId, 'Tool ID');
      this.validateRequiredInput(parameters, 'Parameters');

      const response = await fetch(`${this.config.baseUrl}/api/v1/mcp/tools/${toolId}/execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ parameters })
      });

      const data = await this.validateAndParseResponse<any>(response);
      
      toast.success(`MCP tool '${toolId}' executed successfully!`);
      return data;
    } catch (error) {
      console.error(`Error executing MCP tool '${toolId}':`, error);
      toast.error(`Failed to execute MCP tool '${toolId}'.`);
      throw error;
    }
  }

  // IZA OS Specific AgentOrchestra Integration
  async deployIZAOSAgentOrchestra(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/iza-os/deploy`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          components: [
            'planning-agent',
            'deep-researcher',
            'browser-use-agent',
            'deep-analyzer',
            'tool-calling-agent',
            'mcp-manager-agent'
          ],
          configuration: {
            model: this.config.model,
            maxRetries: this.config.maxRetries,
            timeout: this.config.timeout
          }
        })
      });

      await this.validateAndParseResponse(response);
      toast.success('IZA OS AgentOrchestra deployed successfully!');
    } catch (error) {
      console.error('Error deploying IZA OS AgentOrchestra:', error);
      toast.error('Failed to deploy IZA OS AgentOrchestra.');
      throw error;
    }
  }

  async createIZAOSAgents(): Promise<PlanningAgent[]> {
    const agents = [
      {
        name: 'IZA OS Planning Agent',
        role: 'planning' as const,
        capabilities: ['task_decomposition', 'resource_allocation', 'workflow_orchestration'],
        configuration: {
          model: this.config.model!,
          temperature: 0.3,
          maxTokens: 8192,
          timeout: 30000
        }
      },
      {
        name: 'IZA OS Deep Researcher',
        role: 'research' as const,
        capabilities: ['web_search', 'information_synthesis', 'source_validation'],
        configuration: {
          model: this.config.model!,
          temperature: 0.5,
          maxTokens: 4096,
          timeout: 60000
        }
      },
      {
        name: 'IZA OS Browser Agent',
        role: 'browser' as const,
        capabilities: ['web_automation', 'data_extraction', 'form_interaction'],
        configuration: {
          model: this.config.model!,
          temperature: 0.2,
          maxTokens: 2048,
          timeout: 45000
        }
      },
      {
        name: 'IZA OS Deep Analyzer',
        role: 'analysis' as const,
        capabilities: ['multimodal_analysis', 'pattern_recognition', 'insight_extraction'],
        configuration: {
          model: this.config.model!,
          temperature: 0.4,
          maxTokens: 6144,
          timeout: 90000
        }
      },
      {
        name: 'IZA OS Tool Calling Agent',
        role: 'tool_calling' as const,
        capabilities: ['function_calling', 'api_integration', 'tool_orchestration'],
        configuration: {
          model: this.config.model!,
          temperature: 0.1,
          maxTokens: 1024,
          timeout: 15000
        }
      },
      {
        name: 'IZA OS MCP Manager',
        role: 'mcp_manager' as const,
        capabilities: ['tool_creation', 'tool_evolution', 'mcp_orchestration'],
        configuration: {
          model: this.config.model!,
          temperature: 0.6,
          maxTokens: 4096,
          timeout: 120000
        }
      }
    ];

    const createdAgents: PlanningAgent[] = [];
    
    for (const agentConfig of agents) {
      try {
        const response = await fetch(`${this.config.baseUrl}/api/v1/agents`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            name: agentConfig.name,
            role: agentConfig.role,
            capabilities: agentConfig.capabilities,
            configuration: agentConfig.configuration,
            status: 'active'
          })
        });

        const data = await this.validateAndParseResponse<PlanningAgent>(response);
        this.updateCacheEntry(this.agents, data.id, data);
        createdAgents.push(data);
      } catch (error) {
        console.error(`Error creating ${agentConfig.name}:`, error);
      }
    }

    return createdAgents;
  }

  // Statistics and Analytics
  async getSystemStatistics(): Promise<{
    agents: { total: number; active: number; busy: number; idle: number };
    tasks: { total: number; completed: number; failed: number; running: number };
    mcpTools: { total: number; active: number; deprecated: number };
    researchResults: { total: number; averageConfidence: number };
    analysisResults: { total: number; averageProcessingTime: number };
    performance: {
      overallSuccessRate: number;
      averageTaskExecutionTime: number;
      totalTasksCompleted: number;
    };
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`);
      const data = await this.validateAndParseResponse<{
        agents: { total: number; active: number; busy: number; idle: number };
        tasks: { total: number; completed: number; failed: number; running: number };
        mcp_tools: { total: number; active: number; deprecated: number };
        research_results: { total: number; average_confidence: number };
        analysis_results: { total: number; average_processing_time: number };
        performance: {
          overall_success_rate: number;
          average_task_execution_time: number;
          total_tasks_completed: number;
        };
      }>(response);

      return {
        agents: data.agents,
        tasks: data.tasks,
        mcpTools: {
          total: data.mcp_tools.total,
          active: data.mcp_tools.active,
          deprecated: data.mcp_tools.deprecated
        },
        researchResults: {
          total: data.research_results.total,
          averageConfidence: data.research_results.average_confidence
        },
        analysisResults: {
          total: data.analysis_results.total,
          averageProcessingTime: data.analysis_results.average_processing_time
        },
        performance: {
          overallSuccessRate: data.performance.overall_success_rate,
          averageTaskExecutionTime: data.performance.average_task_execution_time,
          totalTasksCompleted: data.performance.total_tasks_completed
        }
      };
    } catch (error) {
      console.error('Error fetching system statistics:', error);
      
      // Return cached data if API fails
      const agents = Array.from(this.agents.values()).map(entry => entry.data);
      const tasks = Array.from(this.tasks.values()).map(entry => entry.data);
      const mcpTools = Array.from(this.mcpTools.values()).map(entry => entry.data);
      const researchResults = Array.from(this.researchResults.values()).map(entry => entry.data);
      const analysisResults = Array.from(this.analysisResults.values()).map(entry => entry.data);

      return {
        agents: {
          total: agents.length,
          active: agents.filter(a => a.status === 'active').length,
          busy: agents.filter(a => a.status === 'busy').length,
          idle: agents.filter(a => a.status === 'idle').length
        },
        tasks: {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'completed').length,
          failed: tasks.filter(t => t.status === 'failed').length,
          running: tasks.filter(t => t.status === 'running').length
        },
        mcpTools: {
          total: mcpTools.length,
          active: mcpTools.filter(t => t.status === 'active').length,
          deprecated: mcpTools.filter(t => t.status === 'deprecated').length
        },
        researchResults: {
          total: researchResults.length,
          averageConfidence: researchResults.length > 0 
            ? researchResults.reduce((sum, r) => sum + r.confidence, 0) / researchResults.length 
            : 0
        },
        analysisResults: {
          total: analysisResults.length,
          averageProcessingTime: analysisResults.length > 0 
            ? analysisResults.reduce((sum, a) => sum + a.metadata.processingTime, 0) / analysisResults.length 
            : 0
        },
        performance: {
          overallSuccessRate: tasks.length > 0 
            ? tasks.filter(t => t.status === 'completed').length / tasks.length 
            : 0,
          averageTaskExecutionTime: tasks.length > 0 
            ? tasks.reduce((sum, t) => sum + (t.executionTime || 0), 0) / tasks.length 
            : 0,
          totalTasksCompleted: tasks.filter(t => t.status === 'completed').length
        }
      };
    }
  }

  // Configuration Management
  async updateConfiguration(newConfig: Partial<AgentOrchestraConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // Clear caches when configuration changes
    this.agents.clear();
    this.tasks.clear();
    this.mcpTools.clear();
    this.researchResults.clear();
    this.analysisResults.clear();
  }

  // Headers management
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Security check: Only add API keys in server-side environments
    const isServerSide = typeof window === 'undefined' || typeof process !== 'undefined';
    
    if (isServerSide && this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    } else if (!isServerSide) {
      console.warn('AgentOrchestraService: API keys are not included in client-side requests. Ensure secure backend proxy is configured.');
    }

    return headers;
  }

  // Cleanup on service destruction
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance and class for testing
export const agentOrchestraService = new AgentOrchestraService();
export { AgentOrchestraService };
export default agentOrchestraService;
