// Kagent Ecosystem Integration for IZA OS
// Kubernetes-Native AI Agent Framework

import axios from 'axios';
import { toast } from 'react-hot-toast';

const KAGENT_API_BASE_URL = 'http://localhost:8084'; // Kagent API server
const KMCP_API_BASE_URL = 'http://localhost:8085'; // KMCP API server
const KHOOK_API_BASE_URL = 'http://localhost:8086'; // Khook API server

// Constants for default values and configuration
const DEFAULT_TTL_HOURS = 24;
const MAX_CACHE_SIZE = 1000;

interface KagentConfig {
  kagentUrl: string;
  kmcpUrl: string;
  khookUrl: string;
  kubeconfig?: string;
  namespace?: string;
  apiKey?: string;
}

interface KagentAgent {
  id: string;
  name: string;
  namespace: string;
  type: 'llm' | 'tool' | 'workflow' | 'orchestrator';
  status: 'running' | 'stopped' | 'error' | 'pending';
  image: string;
  replicas: number;
  readyReplicas: number;
  createdAt: string;
  lastUpdated: string;
  configuration: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
    workflows?: string[];
  };
  resources: {
    cpu: string;
    memory: string;
    gpu?: string;
  };
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

interface KMCPConfig {
  id: string;
  name: string;
  namespace: string;
  serverType: 'stdio' | 'sse' | 'grpc';
  status: 'running' | 'stopped' | 'error';
  command: string;
  args: string[];
  environment: Record<string, string>;
  resources: {
    cpu: string;
    memory: string;
  };
  capabilities: {
    tools: string[];
    resources: string[];
    prompts: string[];
  };
  createdAt: string;
  lastUpdated: string;
}

interface KhookEvent {
  id: string;
  name: string;
  namespace: string;
  eventType: 'pod-created' | 'pod-deleted' | 'service-created' | 'deployment-updated' | 'custom';
  trigger: {
    resource: string;
    action: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  action: {
    type: 'webhook' | 'agent-call' | 'workflow-trigger';
    target: string;
    payload?: any;
  };
  status: 'active' | 'inactive' | 'error';
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
}

interface A2AMessage {
  id: string;
  from: string;
  to: string;
  messageType: 'request' | 'response' | 'notification' | 'error';
  payload: any;
  timestamp: string;
  status: 'sent' | 'delivered' | 'failed';
  correlationId?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
}

class KagentEcosystemService {
  private config: KagentConfig;
  private agents: Map<string, CacheEntry<KagentAgent>> = new Map();
  private mcpConfigs: Map<string, CacheEntry<KMCPConfig>> = new Map();
  private khookEvents: Map<string, CacheEntry<KhookEvent>> = new Map();
  private a2aMessages: Map<string, CacheEntry<A2AMessage>> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.config = {
      kagentUrl: KAGENT_API_BASE_URL,
      kmcpUrl: KMCP_API_BASE_URL,
      khookUrl: KHOOK_API_BASE_URL,
      namespace: 'iza-os',
      kubeconfig: process.env.KUBECONFIG
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
    this.cleanupCacheEntries(this.mcpConfigs, now, ttlMs);
    this.cleanupCacheEntries(this.khookEvents, now, ttlMs);
    this.cleanupCacheEntries(this.a2aMessages, now, ttlMs);
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
    this.evictCacheEntries(this.mcpConfigs);
    this.evictCacheEntries(this.khookEvents);
    this.evictCacheEntries(this.a2aMessages);
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
  async checkHealth(): Promise<{
    kagent: boolean;
    kmcp: boolean;
    khook: boolean;
  }> {
    try {
      const [kagentHealth, kmcpHealth, khookHealth] = await Promise.allSettled([
        fetch(`${this.config.kagentUrl}/health`).then(r => r.ok),
        fetch(`${this.config.kmcpUrl}/health`).then(r => r.ok),
        fetch(`${this.config.khookUrl}/health`).then(r => r.ok)
      ]);

      return {
        kagent: kagentHealth.status === 'fulfilled' && kagentHealth.value,
        kmcp: kmcpHealth.status === 'fulfilled' && kmcpHealth.value,
        khook: khookHealth.status === 'fulfilled' && khookHealth.value
      };
    } catch (error) {
      console.error('Kagent ecosystem health check failed:', error);
      return { kagent: false, kmcp: false, khook: false };
    }
  }

  // 1. Kagent Agent Management
  async getAgents(namespace?: string): Promise<KagentAgent[]> {
    try {
      const params = new URLSearchParams();
      if (namespace) params.append('namespace', namespace);

      const response = await fetch(`${this.config.kagentUrl}/api/v1/agents?${params}`);
      const data = await this.validateAndParseResponse<{ agents: KagentAgent[] }>(response);
      
      // Cache the agents
      data.agents.forEach(agent => {
        this.updateCacheEntry(this.agents, agent.id, agent);
      });
      
      return data.agents;
    } catch (error) {
      console.error('Error fetching Kagent agents:', error);
      return Array.from(this.agents.values()).map(entry => entry.data);
    }
  }

  async createAgent(agentConfig: {
    name: string;
    type: 'llm' | 'tool' | 'workflow' | 'orchestrator';
    image: string;
    replicas: number;
    configuration: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      tools?: string[];
      workflows?: string[];
    };
    resources: {
      cpu: string;
      memory: string;
      gpu?: string;
    };
    namespace?: string;
  }): Promise<KagentAgent> {
    try {
      this.validateRequiredInput(agentConfig.name, 'Agent name');
      this.validateRequiredInput(agentConfig.type, 'Agent type');
      this.validateRequiredInput(agentConfig.image, 'Agent image');

      const response = await fetch(`${this.config.kagentUrl}/api/v1/agents`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: agentConfig.name,
          type: agentConfig.type,
          image: agentConfig.image,
          replicas: agentConfig.replicas || 1,
          configuration: agentConfig.configuration || {},
          resources: agentConfig.resources,
          namespace: agentConfig.namespace || this.config.namespace
        })
      });

      const data = await this.validateAndParseResponse<KagentAgent>(response);
      this.updateCacheEntry(this.agents, data.id, data);
      
      toast.success(`Kagent agent '${agentConfig.name}' created successfully!`);
      return data;
    } catch (error) {
      console.error(`Error creating Kagent agent '${agentConfig.name}':`, error);
      toast.error(`Failed to create Kagent agent '${agentConfig.name}'.`);
      throw error;
    }
  }

  async scaleAgent(agentId: string, replicas: number): Promise<void> {
    try {
      this.validateRequiredInput(agentId, 'Agent ID');
      this.validateRequiredInput(replicas, 'Replicas');

      const response = await fetch(`${this.config.kagentUrl}/api/v1/agents/${agentId}/scale`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ replicas })
      });

      await this.validateAndParseResponse(response);
      toast.success(`Agent scaled to ${replicas} replicas successfully!`);
    } catch (error) {
      console.error(`Error scaling agent ${agentId}:`, error);
      toast.error(`Failed to scale agent ${agentId}.`);
      throw error;
    }
  }

  // 2. KMCP Server Management
  async getMCPConfigs(namespace?: string): Promise<KMCPConfig[]> {
    try {
      const params = new URLSearchParams();
      if (namespace) params.append('namespace', namespace);

      const response = await fetch(`${this.config.kmcpUrl}/api/v1/configs?${params}`);
      const data = await this.validateAndParseResponse<{ configs: KMCPConfig[] }>(response);
      
      // Cache the configs
      data.configs.forEach(config => {
        this.updateCacheEntry(this.mcpConfigs, config.id, config);
      });
      
      return data.configs;
    } catch (error) {
      console.error('Error fetching KMCP configs:', error);
      return Array.from(this.mcpConfigs.values()).map(entry => entry.data);
    }
  }

  async createMCPConfig(configData: {
    name: string;
    serverType: 'stdio' | 'sse' | 'grpc';
    command: string;
    args: string[];
    environment?: Record<string, string>;
    resources: {
      cpu: string;
      memory: string;
    };
    capabilities: {
      tools: string[];
      resources: string[];
      prompts: string[];
    };
    namespace?: string;
  }): Promise<KMCPConfig> {
    try {
      this.validateRequiredInput(configData.name, 'Config name');
      this.validateRequiredInput(configData.command, 'Command');
      this.validateRequiredInput(configData.serverType, 'Server type');

      const response = await fetch(`${this.config.kmcpUrl}/api/v1/configs`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: configData.name,
          serverType: configData.serverType,
          command: configData.command,
          args: configData.args || [],
          environment: configData.environment || {},
          resources: configData.resources,
          capabilities: configData.capabilities,
          namespace: configData.namespace || this.config.namespace
        })
      });

      const data = await this.validateAndParseResponse<KMCPConfig>(response);
      this.updateCacheEntry(this.mcpConfigs, data.id, data);
      
      toast.success(`KMCP config '${configData.name}' created successfully!`);
      return data;
    } catch (error) {
      console.error(`Error creating KMCP config '${configData.name}':`, error);
      toast.error(`Failed to create KMCP config '${configData.name}'.`);
      throw error;
    }
  }

  // 3. Khook Event Management
  async getKhookEvents(namespace?: string): Promise<KhookEvent[]> {
    try {
      const params = new URLSearchParams();
      if (namespace) params.append('namespace', namespace);

      const response = await fetch(`${this.config.khookUrl}/api/v1/events?${params}`);
      const data = await this.validateAndParseResponse<{ events: KhookEvent[] }>(response);
      
      // Cache the events
      data.events.forEach(event => {
        this.updateCacheEntry(this.khookEvents, event.id, event);
      });
      
      return data.events;
    } catch (error) {
      console.error('Error fetching Khook events:', error);
      return Array.from(this.khookEvents.values()).map(entry => entry.data);
    }
  }

  async createKhookEvent(eventConfig: {
    name: string;
    eventType: 'pod-created' | 'pod-deleted' | 'service-created' | 'deployment-updated' | 'custom';
    trigger: {
      resource: string;
      action: string;
      namespace?: string;
      labels?: Record<string, string>;
    };
    action: {
      type: 'webhook' | 'agent-call' | 'workflow-trigger';
      target: string;
      payload?: any;
    };
    namespace?: string;
  }): Promise<KhookEvent> {
    try {
      this.validateRequiredInput(eventConfig.name, 'Event name');
      this.validateRequiredInput(eventConfig.eventType, 'Event type');
      this.validateRequiredInput(eventConfig.trigger, 'Trigger');
      this.validateRequiredInput(eventConfig.action, 'Action');

      const response = await fetch(`${this.config.khookUrl}/api/v1/events`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: eventConfig.name,
          eventType: eventConfig.eventType,
          trigger: eventConfig.trigger,
          action: eventConfig.action,
          namespace: eventConfig.namespace || this.config.namespace
        })
      });

      const data = await this.validateAndParseResponse<KhookEvent>(response);
      this.updateCacheEntry(this.khookEvents, data.id, data);
      
      toast.success(`Khook event '${eventConfig.name}' created successfully!`);
      return data;
    } catch (error) {
      console.error(`Error creating Khook event '${eventConfig.name}':`, error);
      toast.error(`Failed to create Khook event '${eventConfig.name}'.`);
      throw error;
    }
  }

  // 4. A2A Communication
  async sendA2AMessage(message: {
    to: string;
    messageType: 'request' | 'response' | 'notification' | 'error';
    payload: any;
    correlationId?: string;
  }): Promise<A2AMessage> {
    try {
      this.validateRequiredInput(message.to, 'Recipient');
      this.validateRequiredInput(message.messageType, 'Message type');
      this.validateRequiredInput(message.payload, 'Payload');

      const response = await fetch(`${this.config.kagentUrl}/api/v1/a2a/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          to: message.to,
          messageType: message.messageType,
          payload: message.payload,
          correlationId: message.correlationId
        })
      });

      const data = await this.validateAndParseResponse<A2AMessage>(response);
      this.updateCacheEntry(this.a2aMessages, data.id, data);
      
      toast.success(`A2A message sent to '${message.to}' successfully!`);
      return data;
    } catch (error) {
      console.error(`Error sending A2A message to '${message.to}':`, error);
      toast.error(`Failed to send A2A message to '${message.to}'.`);
      throw error;
    }
  }

  async getA2AMessages(from?: string, to?: string): Promise<A2AMessage[]> {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await fetch(`${this.config.kagentUrl}/api/v1/a2a/messages?${params}`);
      const data = await this.validateAndParseResponse<{ messages: A2AMessage[] }>(response);
      
      // Cache the messages
      data.messages.forEach(message => {
        this.updateCacheEntry(this.a2aMessages, message.id, message);
      });
      
      return data.messages;
    } catch (error) {
      console.error('Error fetching A2A messages:', error);
      return Array.from(this.a2aMessages.values()).map(entry => entry.data);
    }
  }

  // IZA OS Specific Kagent Integration
  async deployIZAOSKagentEcosystem(): Promise<void> {
    try {
      const response = await fetch(`${this.config.kagentUrl}/api/v1/iza-os/deploy`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          namespace: this.config.namespace,
          components: [
            'kagent-controller',
            'kmcp-controller',
            'khook-controller',
            'a2a-broker',
            'iza-os-agents'
          ],
          replicas: 3,
          resources: {
            cpu: '2',
            memory: '4Gi'
          }
        })
      });

      await this.validateAndParseResponse(response);
      toast.success('IZA OS Kagent ecosystem deployed successfully!');
    } catch (error) {
      console.error('Error deploying IZA OS Kagent ecosystem:', error);
      toast.error('Failed to deploy IZA OS Kagent ecosystem.');
      throw error;
    }
  }

  async createIZAOSAgents(): Promise<KagentAgent[]> {
    const agents = [
      {
        name: 'IZA OS CEO Kagent',
        type: 'orchestrator' as const,
        image: 'iza-os/ceo-agent:latest',
        replicas: 2,
        configuration: {
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
          maxTokens: 4096,
          tools: ['filesystem', 'web_search', 'business_intelligence'],
          workflows: ['strategic_planning', 'decision_making']
        },
        resources: {
          cpu: '1',
          memory: '2Gi',
          gpu: '1'
        }
      },
      {
        name: 'IZA OS CTO Kagent',
        type: 'llm' as const,
        image: 'iza-os/cto-agent:latest',
        replicas: 3,
        configuration: {
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.5,
          maxTokens: 8192,
          tools: ['github', 'docker', 'kubernetes', 'architecture_tools'],
          workflows: ['technical_planning', 'code_review', 'deployment']
        },
        resources: {
          cpu: '2',
          memory: '4Gi',
          gpu: '1'
        }
      },
      {
        name: 'IZA OS Maestro Kagent',
        type: 'orchestrator' as const,
        image: 'iza-os/maestro-agent:latest',
        replicas: 5,
        configuration: {
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.3,
          maxTokens: 16384,
          tools: ['agent_coordination', 'workflow_management', 'resource_optimization'],
          workflows: ['agent_orchestration', 'load_balancing', 'performance_monitoring']
        },
        resources: {
          cpu: '4',
          memory: '8Gi',
          gpu: '2'
        }
      }
    ];

    const createdAgents: KagentAgent[] = [];
    
    for (const agentConfig of agents) {
      try {
        const agent = await this.createAgent({
          ...agentConfig,
          namespace: this.config.namespace
        });
        createdAgents.push(agent);
      } catch (error) {
        console.error(`Error creating ${agentConfig.name}:`, error);
      }
    }

    return createdAgents;
  }

  async createIZAOSKhookEvents(): Promise<KhookEvent[]> {
    const events = [
      {
        name: 'IZA OS Pod Creation Handler',
        eventType: 'pod-created' as const,
        trigger: {
          resource: 'Pod',
          action: 'create',
          namespace: this.config.namespace,
          labels: { 'app.kubernetes.io/part-of': 'iza-os' }
        },
        action: {
          type: 'agent-call' as const,
          target: 'IZA OS Maestro Kagent',
          payload: {
            action: 'register_new_pod',
            namespace: this.config.namespace
          }
        }
      },
      {
        name: 'IZA OS Service Update Handler',
        eventType: 'service-created' as const,
        trigger: {
          resource: 'Service',
          action: 'create',
          namespace: this.config.namespace
        },
        action: {
          type: 'workflow-trigger' as const,
          target: 'service_discovery_workflow',
          payload: {
            workflow: 'update_service_registry',
            namespace: this.config.namespace
          }
        }
      },
      {
        name: 'IZA OS Deployment Scale Handler',
        eventType: 'deployment-updated' as const,
        trigger: {
          resource: 'Deployment',
          action: 'update',
          namespace: this.config.namespace,
          labels: { 'app.kubernetes.io/part-of': 'iza-os' }
        },
        action: {
          type: 'agent-call' as const,
          target: 'IZA OS CTO Kagent',
          payload: {
            action: 'analyze_scaling_event',
            namespace: this.config.namespace
          }
        }
      }
    ];

    const createdEvents: KhookEvent[] = [];
    
    for (const eventConfig of events) {
      try {
        const event = await this.createKhookEvent({
          ...eventConfig,
          namespace: this.config.namespace
        });
        createdEvents.push(event);
      } catch (error) {
        console.error(`Error creating ${eventConfig.name}:`, error);
      }
    }

    return createdEvents;
  }

  // Statistics and Analytics
  async getEcosystemStatistics(): Promise<{
    agents: { total: number; running: number; orchestrators: number; llm: number };
    mcpConfigs: { total: number; running: number; stdio: number; sse: number };
    khookEvents: { total: number; active: number; triggered: number };
    a2aMessages: { total: number; sent: number; delivered: number };
    systemHealth: { kagent: boolean; kmcp: boolean; khook: boolean };
  }> {
    try {
      const response = await fetch(`${this.config.kagentUrl}/api/v1/statistics`);
      const data = await this.validateAndParseResponse<{
        agents: { total: number; running: number; orchestrators: number; llm: number };
        mcp_configs: { total: number; running: number; stdio: number; sse: number };
        khook_events: { total: number; active: number; triggered: number };
        a2a_messages: { total: number; sent: number; delivered: number };
        system_health: { kagent: boolean; kmcp: boolean; khook: boolean };
      }>(response);

      return {
        agents: data.agents,
        mcpConfigs: {
          total: data.mcp_configs.total,
          running: data.mcp_configs.running,
          stdio: data.mcp_configs.stdio,
          sse: data.mcp_configs.sse
        },
        khookEvents: {
          total: data.khook_events.total,
          active: data.khook_events.active,
          triggered: data.khook_events.triggered
        },
        a2aMessages: {
          total: data.a2a_messages.total,
          sent: data.a2a_messages.sent,
          delivered: data.a2a_messages.delivered
        },
        systemHealth: data.system_health
      };
    } catch (error) {
      console.error('Error fetching ecosystem statistics:', error);
      
      // Return cached data if API fails
      const agents = Array.from(this.agents.values()).map(entry => entry.data);
      const mcpConfigs = Array.from(this.mcpConfigs.values()).map(entry => entry.data);
      const khookEvents = Array.from(this.khookEvents.values()).map(entry => entry.data);
      const a2aMessages = Array.from(this.a2aMessages.values()).map(entry => entry.data);

      return {
        agents: {
          total: agents.length,
          running: agents.filter(a => a.status === 'running').length,
          orchestrators: agents.filter(a => a.type === 'orchestrator').length,
          llm: agents.filter(a => a.type === 'llm').length
        },
        mcpConfigs: {
          total: mcpConfigs.length,
          running: mcpConfigs.filter(c => c.status === 'running').length,
          stdio: mcpConfigs.filter(c => c.serverType === 'stdio').length,
          sse: mcpConfigs.filter(c => c.serverType === 'sse').length
        },
        khookEvents: {
          total: khookEvents.length,
          active: khookEvents.filter(e => e.status === 'active').length,
          triggered: khookEvents.reduce((sum, e) => sum + e.triggerCount, 0)
        },
        a2aMessages: {
          total: a2aMessages.length,
          sent: a2aMessages.filter(m => m.status === 'sent').length,
          delivered: a2aMessages.filter(m => m.status === 'delivered').length
        },
        systemHealth: { kagent: false, kmcp: false, khook: false }
      };
    }
  }

  // Configuration Management
  async updateConfiguration(newConfig: Partial<KagentConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // Clear caches when configuration changes
    this.agents.clear();
    this.mcpConfigs.clear();
    this.khookEvents.clear();
    this.a2aMessages.clear();
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
      console.warn('KagentEcosystemService: API keys are not included in client-side requests. Ensure secure backend proxy is configured.');
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
export const kagentEcosystemService = new KagentEcosystemService();
export { KagentEcosystemService };
export default kagentEcosystemService;
