// Magentic-UI Integration for IZA OS
// Microsoft's Human-Centered Web Agent Framework

import axios from 'axios';
import { toast } from 'react-hot-toast';

const MAGENTIC_UI_API_BASE_URL = 'http://localhost:8081'; // Magentic-UI default port

// Constants for default values and configuration
const DEFAULT_MODEL = 'gpt-4o-2024-08-06';
const DEFAULT_TTL_HOURS = 24;
const MAX_CACHE_SIZE = 1000;

interface MagenticUIConfig {
  baseUrl: string;
  apiKey?: string;
  orchestratorClient?: string;
  coderClient?: string;
  webSurferClient?: string;
  fileSurferClient?: string;
  actionGuardClient?: string;
  planLearningClient?: string;
}

interface WebAgent {
  id: string;
  name: string;
  type: 'orchestrator' | 'coder' | 'web_surfer' | 'file_surfer' | 'action_guard' | 'plan_learning';
  description: string;
  status: 'active' | 'inactive' | 'busy' | 'error';
  capabilities: string[];
  model: string;
  lastUsed: string;
  performance: {
    responseTime: number;
    accuracy: number;
    userSatisfaction: number;
  };
}

interface WebTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  agentId: string;
  input: string;
  output?: string;
  startedAt: string;
  completedAt?: string;
  executionTime?: number;
  metadata: {
    url?: string;
    screenshot?: string;
    actions?: string[];
    errors?: string[];
  };
}

interface MCPServerConfig {
  name: string;
  description: string;
  command: string;
  args: string[];
  type: 'stdio' | 'sse';
  status: 'running' | 'stopped' | 'error';
  capabilities: {
    tools: string[];
    resources: string[];
    prompts: string[];
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
}

class MagenticUIService {
  private config: MagenticUIConfig;
  private webAgents: Map<string, CacheEntry<WebAgent>> = new Map();
  private webTasks: Map<string, CacheEntry<WebTask>> = new Map();
  private mcpServers: Map<string, CacheEntry<MCPServerConfig>> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.config = {
      baseUrl: MAGENTIC_UI_API_BASE_URL
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

    this.cleanupCacheEntries(this.webAgents, now, ttlMs);
    this.cleanupCacheEntries(this.webTasks, now, ttlMs);
    this.cleanupCacheEntries(this.mcpServers, now, ttlMs);
  }

  private cleanupCacheEntries<T>(cache: Map<string, CacheEntry<T>>, now: number, ttlMs: number): void {
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttlMs) {
        cache.delete(key);
      }
    }
  }

  private evictOldEntries(): void {
    this.evictCacheEntries(this.webAgents);
    this.evictCacheEntries(this.webTasks);
    this.evictCacheEntries(this.mcpServers);
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
      console.error('Magentic-UI health check failed:', error);
      return false;
    }
  }

  // Web Agent Management
  async getWebAgents(): Promise<WebAgent[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/agents`);
      const data = await this.validateAndParseResponse<{ agents: WebAgent[] }>(response);
      
      // Cache the agents
      data.agents.forEach(agent => {
        this.updateCacheEntry(this.webAgents, agent.id, agent);
      });
      
      return data.agents;
    } catch (error) {
      console.error('Error fetching web agents:', error);
      return Array.from(this.webAgents.values()).map(entry => entry.data);
    }
  }

  async createWebTask(taskConfig: {
    name: string;
    description: string;
    agentType: 'orchestrator' | 'coder' | 'web_surfer' | 'file_surfer' | 'action_guard' | 'plan_learning';
    input: string;
    url?: string;
    metadata?: any;
  }): Promise<WebTask> {
    try {
      this.validateRequiredInput(taskConfig.name, 'Task name');
      this.validateRequiredInput(taskConfig.description, 'Task description');
      this.validateRequiredInput(taskConfig.input, 'Task input');

      const response = await fetch(`${this.config.baseUrl}/api/v1/tasks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: taskConfig.name,
          description: taskConfig.description,
          agent_type: taskConfig.agentType,
          input: taskConfig.input,
          url: taskConfig.url,
          metadata: taskConfig.metadata || {}
        })
      });

      const data = await this.validateAndParseResponse<WebTask>(response);
      this.updateCacheEntry(this.webTasks, data.id, data);
      
      toast.success(`Web task '${taskConfig.name}' created successfully!`);
      return data;
    } catch (error) {
      console.error(`Error creating web task '${taskConfig.name}':`, error);
      toast.error(`Failed to create web task '${taskConfig.name}'.`);
      throw error;
    }
  }

  async executeWebTask(taskId: string): Promise<WebTask> {
    try {
      this.validateRequiredInput(taskId, 'Task ID');

      const response = await fetch(`${this.config.baseUrl}/api/v1/tasks/${taskId}/execute`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      const data = await this.validateAndParseResponse<WebTask>(response);
      this.updateCacheEntry(this.webTasks, taskId, data);
      
      toast.success(`Web task '${taskId}' executed successfully!`);
      return data;
    } catch (error) {
      console.error(`Error executing web task '${taskId}':`, error);
      toast.error(`Failed to execute web task '${taskId}'.`);
      throw error;
    }
  }

  async getWebTaskStatus(taskId: string): Promise<WebTask> {
    try {
      this.validateRequiredInput(taskId, 'Task ID');

      const response = await fetch(`${this.config.baseUrl}/api/v1/tasks/${taskId}`);
      const data = await this.validateAndParseResponse<WebTask>(response);
      
      this.updateCacheEntry(this.webTasks, taskId, data);
      return data;
    } catch (error) {
      console.error(`Error fetching web task status '${taskId}':`, error);
      toast.error(`Failed to fetch web task status '${taskId}'.`);
      throw error;
    }
  }

  // MCP Server Management
  async getMCPServers(): Promise<MCPServerConfig[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/mcp-servers`);
      const data = await this.validateAndParseResponse<{ servers: MCPServerConfig[] }>(response);
      
      // Cache the servers
      data.servers.forEach(server => {
        this.updateCacheEntry(this.mcpServers, server.name, server);
      });
      
      return data.servers;
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
      return Array.from(this.mcpServers.values()).map(entry => entry.data);
    }
  }

  async addMCPServer(serverConfig: {
    name: string;
    description: string;
    command: string;
    args: string[];
    type: 'stdio' | 'sse';
  }): Promise<MCPServerConfig> {
    try {
      this.validateRequiredInput(serverConfig.name, 'Server name');
      this.validateRequiredInput(serverConfig.command, 'Server command');
      this.validateRequiredInput(serverConfig.description, 'Server description');

      const response = await fetch(`${this.config.baseUrl}/api/v1/mcp-servers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: serverConfig.name,
          description: serverConfig.description,
          command: serverConfig.command,
          args: serverConfig.args,
          type: serverConfig.type,
          status: 'running'
        })
      });

      const data = await this.validateAndParseResponse<MCPServerConfig>(response);
      this.updateCacheEntry(this.mcpServers, serverConfig.name, data);
      
      toast.success(`MCP server '${serverConfig.name}' added successfully!`);
      return data;
    } catch (error) {
      console.error(`Error adding MCP server '${serverConfig.name}':`, error);
      toast.error(`Failed to add MCP server '${serverConfig.name}'.`);
      throw error;
    }
  }

  // IZA OS Specific Web Agents
  async createIZAOSWebAgents(): Promise<WebAgent[]> {
    const agents = [
      {
        name: 'IZA OS Web Orchestrator',
        type: 'orchestrator' as const,
        description: 'Orchestrates web-based operations for IZA OS ecosystem',
        capabilities: ['web_navigation', 'task_coordination', 'multi_agent_management'],
        model: DEFAULT_MODEL
      },
      {
        name: 'IZA OS Web Coder',
        type: 'coder' as const,
        description: 'Handles web-based coding tasks and development operations',
        capabilities: ['code_generation', 'web_automation', 'api_integration'],
        model: DEFAULT_MODEL
      },
      {
        name: 'IZA OS Web Surfer',
        type: 'web_surfer' as const,
        description: 'Performs web browsing and data collection for IZA OS',
        capabilities: ['web_browsing', 'data_extraction', 'form_interaction'],
        model: DEFAULT_MODEL
      },
      {
        name: 'IZA OS File Surfer',
        type: 'file_surfer' as const,
        description: 'Manages file operations and document processing',
        capabilities: ['file_management', 'document_processing', 'data_analysis'],
        model: DEFAULT_MODEL
      },
      {
        name: 'IZA OS Action Guard',
        type: 'action_guard' as const,
        description: 'Ensures safe and secure web operations',
        capabilities: ['security_monitoring', 'action_validation', 'risk_assessment'],
        model: DEFAULT_MODEL
      },
      {
        name: 'IZA OS Plan Learning',
        type: 'plan_learning' as const,
        description: 'Learns from web interactions and improves planning',
        capabilities: ['pattern_recognition', 'plan_optimization', 'learning_adaptation'],
        model: DEFAULT_MODEL
      }
    ];

    const createdAgents: WebAgent[] = [];
    
    for (const agentConfig of agents) {
      try {
        const response = await fetch(`${this.config.baseUrl}/api/v1/agents`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            name: agentConfig.name,
            type: agentConfig.type,
            description: agentConfig.description,
            capabilities: agentConfig.capabilities,
            model: agentConfig.model,
            status: 'active'
          })
        });

        const data = await this.validateAndParseResponse<WebAgent>(response);
        this.updateCacheEntry(this.webAgents, data.id, data);
        createdAgents.push(data);
      } catch (error) {
        console.error(`Error creating ${agentConfig.name}:`, error);
      }
    }

    return createdAgents;
  }

  // Web Task Execution Examples
  async executeWebResearchTask(query: string, url?: string): Promise<WebTask> {
    return this.createWebTask({
      name: 'IZA OS Web Research',
      description: `Research task: ${query}`,
      agentType: 'web_surfer',
      input: query,
      url: url,
      metadata: {
        research_type: 'market_analysis',
        priority: 'high',
        expected_duration: '5-10 minutes'
      }
    });
  }

  async executeWebAutomationTask(task: string, targetUrl: string): Promise<WebTask> {
    return this.createWebTask({
      name: 'IZA OS Web Automation',
      description: `Automation task: ${task}`,
      agentType: 'coder',
      input: task,
      url: targetUrl,
      metadata: {
        automation_type: 'workflow',
        complexity: 'medium',
        requires_interaction: true
      }
    });
  }

  async executeFileProcessingTask(filePath: string, operation: string): Promise<WebTask> {
    return this.createWebTask({
      name: 'IZA OS File Processing',
      description: `File processing: ${operation}`,
      agentType: 'file_surfer',
      input: `Process file: ${filePath} - Operation: ${operation}`,
      metadata: {
        file_path: filePath,
        operation: operation,
        file_type: 'document',
        processing_mode: 'batch'
      }
    });
  }

  // Statistics and Analytics
  async getSystemStatistics(): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    totalMCPServers: number;
    activeMCPServers: number;
    averageExecutionTime: number;
    totalExecutions: number;
    systemHealth: {
      status: string;
      uptime: number;
      performance: number;
    };
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`);
      const data = await this.validateAndParseResponse<{
        total_agents?: number;
        active_agents?: number;
        total_tasks?: number;
        completed_tasks?: number;
        total_mcp_servers?: number;
        active_mcp_servers?: number;
        average_execution_time?: number;
        total_executions?: number;
        system_health?: {
          status: string;
          uptime: number;
          performance: number;
        };
      }>(response);

      return {
        totalAgents: data.total_agents || 0,
        activeAgents: data.active_agents || 0,
        totalTasks: data.total_tasks || 0,
        completedTasks: data.completed_tasks || 0,
        totalMCPServers: data.total_mcp_servers || 0,
        activeMCPServers: data.active_mcp_servers || 0,
        averageExecutionTime: data.average_execution_time || 0,
        totalExecutions: data.total_executions || 0,
        systemHealth: data.system_health || {
          status: 'healthy',
          uptime: 100,
          performance: 95
        }
      };
    } catch (error) {
      console.error('Error fetching system statistics:', error);
      
      // Return cached data if API fails
      const agents = Array.from(this.webAgents.values()).map(entry => entry.data);
      const tasks = Array.from(this.webTasks.values()).map(entry => entry.data);
      const servers = Array.from(this.mcpServers.values()).map(entry => entry.data);

      return {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'active').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        totalMCPServers: servers.length,
        activeMCPServers: servers.filter(s => s.status === 'running').length,
        averageExecutionTime: tasks.length > 0 
          ? tasks.reduce((sum, t) => sum + (t.executionTime || 0), 0) / tasks.length 
          : 0,
        totalExecutions: tasks.length,
        systemHealth: {
          status: 'healthy',
          uptime: 100,
          performance: 95
        }
      };
    }
  }

  // Configuration Management
  async updateConfiguration(newConfig: Partial<MagenticUIConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // Clear caches when configuration changes
    this.webAgents.clear();
    this.webTasks.clear();
    this.mcpServers.clear();
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
      console.warn('MagenticUIService: API keys are not included in client-side requests. Ensure secure backend proxy is configured.');
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
export const magenticUIService = new MagenticUIService();
export { MagenticUIService };
export default magenticUIService;
