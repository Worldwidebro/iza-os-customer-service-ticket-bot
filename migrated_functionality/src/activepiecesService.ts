/**
 * ActivePieces Integration Service
 * Complete integration with ActivePieces workflow automation platform
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types for ActivePieces API
export interface ActivePiecesConfig {
  apiKey: string;
  baseUrl: string;
  projectId: string;
}

export interface Flow {
  id: string;
  name: string;
  version: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  trigger: FlowTrigger;
  actions: FlowAction[];
  created: string;
  updated: string;
  lastRun?: string;
  executionCount: number;
  successRate: number;
}

export interface FlowTrigger {
  type: 'WEBHOOK' | 'SCHEDULE' | 'MANUAL' | 'FORM';
  settings: Record<string, any>;
}

export interface FlowAction {
  type: string;
  action: string;
  settings: Record<string, any>;
  displayName: string;
}

export interface ExecutionResult {
  id: string;
  flowId: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  startTime: string;
  endTime?: string;
  duration?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  timestamp: string;
  step?: string;
}

export interface FlowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecution?: string;
  executionsToday: number;
  executionsThisWeek: number;
  executionsThisMonth: number;
}

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  version: string;
  actions: string[];
  triggers: string[];
  category: string;
  verified: boolean;
}

export class ActivePiecesService {
  private client: AxiosInstance;
  private config: ActivePiecesConfig;

  constructor(config: ActivePiecesConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.baseUrl}/api/v1`,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Project-Id': config.projectId
      },
      timeout: 30000
    });

    // Add request/response interceptors
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[ActivePieces] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[ActivePieces] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`[ActivePieces] Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('[ActivePieces] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // =============================================================================
  // FLOW MANAGEMENT
  // =============================================================================

  /**
   * Get all flows in the project
   */
  async getFlows(): Promise<Flow[]> {
    try {
      const response: AxiosResponse<{ data: Flow[] }> = await this.client.get('/flows');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get flows:', error);
      throw new Error('Failed to fetch flows from ActivePieces');
    }
  }

  /**
   * Get a specific flow by ID
   */
  async getFlow(flowId: string): Promise<Flow> {
    try {
      const response: AxiosResponse<Flow> = await this.client.get(`/flows/${flowId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get flow ${flowId}:`, error);
      throw new Error(`Failed to fetch flow ${flowId} from ActivePieces`);
    }
  }

  /**
   * Create a new flow
   */
  async createFlow(flowData: Partial<Flow>): Promise<Flow> {
    try {
      const response: AxiosResponse<Flow> = await this.client.post('/flows', flowData);
      return response.data;
    } catch (error) {
      console.error('Failed to create flow:', error);
      throw new Error('Failed to create flow in ActivePieces');
    }
  }

  /**
   * Update an existing flow
   */
  async updateFlow(flowId: string, flowData: Partial<Flow>): Promise<Flow> {
    try {
      const response: AxiosResponse<Flow> = await this.client.patch(`/flows/${flowId}`, flowData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update flow ${flowId}:`, error);
      throw new Error(`Failed to update flow ${flowId} in ActivePieces`);
    }
  }

  /**
   * Delete a flow
   */
  async deleteFlow(flowId: string): Promise<void> {
    try {
      await this.client.delete(`/flows/${flowId}`);
    } catch (error) {
      console.error(`Failed to delete flow ${flowId}:`, error);
      throw new Error(`Failed to delete flow ${flowId} from ActivePieces`);
    }
  }

  /**
   * Toggle flow status (active/inactive)
   */
  async toggleFlow(flowId: string, active: boolean): Promise<Flow> {
    try {
      const response: AxiosResponse<Flow> = await this.client.patch(`/flows/${flowId}`, {
        status: active ? 'ACTIVE' : 'INACTIVE'
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to toggle flow ${flowId}:`, error);
      throw new Error(`Failed to toggle flow ${flowId} status`);
    }
  }

  // =============================================================================
  // FLOW EXECUTION
  // =============================================================================

  /**
   * Execute a flow manually
   */
  async executeFlow(flowId: string, inputData: Record<string, any> = {}): Promise<ExecutionResult> {
    try {
      const response: AxiosResponse<ExecutionResult> = await this.client.post(
        `/flows/${flowId}/execute`,
        { input: inputData }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to execute flow ${flowId}:`, error);
      throw new Error(`Failed to execute flow ${flowId}`);
    }
  }

  /**
   * Get execution history for a flow
   */
  async getFlowExecutions(flowId: string, limit: number = 50): Promise<ExecutionResult[]> {
    try {
      const response: AxiosResponse<{ data: ExecutionResult[] }> = await this.client.get(
        `/flows/${flowId}/executions`,
        { params: { limit } }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get executions for flow ${flowId}:`, error);
      throw new Error(`Failed to fetch executions for flow ${flowId}`);
    }
  }

  /**
   * Get a specific execution result
   */
  async getExecution(executionId: string): Promise<ExecutionResult> {
    try {
      const response: AxiosResponse<ExecutionResult> = await this.client.get(`/executions/${executionId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get execution ${executionId}:`, error);
      throw new Error(`Failed to fetch execution ${executionId}`);
    }
  }

  // =============================================================================
  // FLOW METRICS
  // =============================================================================

  /**
   * Get metrics for a specific flow
   */
  async getFlowMetrics(flowId: string): Promise<FlowMetrics> {
    try {
      const response: AxiosResponse<FlowMetrics> = await this.client.get(`/flows/${flowId}/metrics`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get metrics for flow ${flowId}:`, error);
      throw new Error(`Failed to fetch metrics for flow ${flowId}`);
    }
  }

  /**
   * Get overall project metrics
   */
  async getProjectMetrics(): Promise<{
    totalFlows: number;
    activeFlows: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    successRate: number;
  }> {
    try {
      const response: AxiosResponse<any> = await this.client.get('/metrics');
      return response.data;
    } catch (error) {
      console.error('Failed to get project metrics:', error);
      throw new Error('Failed to fetch project metrics');
    }
  }

  // =============================================================================
  // MCP SERVERS
  // =============================================================================

  /**
   * Get available MCP servers
   */
  async getMCPServers(): Promise<MCPServer[]> {
    try {
      const response: AxiosResponse<{ data: MCPServer[] }> = await this.client.get('/pieces');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get MCP servers:', error);
      throw new Error('Failed to fetch MCP servers');
    }
  }

  /**
   * Get specific MCP server details
   */
  async getMCPServer(pieceName: string): Promise<MCPServer> {
    try {
      const response: AxiosResponse<MCPServer> = await this.client.get(`/pieces/${pieceName}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get MCP server ${pieceName}:`, error);
      throw new Error(`Failed to fetch MCP server ${pieceName}`);
    }
  }

  // =============================================================================
  // IZA OS SPECIFIC INTEGRATIONS
  // =============================================================================

  /**
   * Create IZA OS agent deployment workflow
   */
  async createAgentDeploymentFlow(agentConfig: {
    name: string;
    type: 'ecosystem' | 'portfolio' | 'financial' | 'content';
    configuration: Record<string, any>;
  }): Promise<Flow> {
    const flowData = {
      name: `Deploy Agent: ${agentConfig.name}`,
      trigger: {
        type: 'WEBHOOK' as const,
        settings: {
          webhookUrl: `/webhooks/agent-deploy/${agentConfig.name.toLowerCase().replace(/\s+/g, '-')}`
        }
      },
      actions: [
        {
          type: 'memu-iza-os',
          action: 'deployAgent',
          settings: agentConfig,
          displayName: `Deploy ${agentConfig.name} Agent`
        }
      ]
    };

    return this.createFlow(flowData);
  }

  /**
   * Create business generation workflow
   */
  async createBusinessGenerationFlow(businessConfig: {
    name: string;
    industry: string;
    requirements: Record<string, any>;
  }): Promise<Flow> {
    const flowData = {
      name: `Generate Business: ${businessConfig.name}`,
      trigger: {
        type: 'SCHEDULE' as const,
        settings: {
          cronExpression: '0 0 * * *' // Daily at midnight
        }
      },
      actions: [
        {
          type: 'memu-iza-os',
          action: 'generateBusiness',
          settings: businessConfig,
          displayName: `Generate ${businessConfig.name} Business`
        },
        {
          type: 'memu-iza-os',
          action: 'deployInfrastructure',
          settings: { businessId: '{{generateBusiness.businessId}}' },
          displayName: 'Deploy Infrastructure'
        },
        {
          type: 'memu-iza-os',
          action: 'setupMonitoring',
          settings: { businessId: '{{generateBusiness.businessId}}' },
          displayName: 'Setup Monitoring'
        }
      ]
    };

    return this.createFlow(flowData);
  }

  /**
   * Create analytics workflow
   */
  async createAnalyticsWorkflow(): Promise<Flow> {
    const flowData = {
      name: 'Real-time Analytics Processing',
      trigger: {
        type: 'WEBHOOK' as const,
        settings: {
          webhookUrl: '/webhooks/analytics-update'
        }
      },
      actions: [
        {
          type: 'memu-iza-os',
          action: 'processAnalyticsData',
          settings: {},
          displayName: 'Process Analytics Data'
        },
        {
          type: 'memu-iza-os',
          action: 'updateMetrics',
          settings: {},
          displayName: 'Update Metrics'
        },
        {
          type: 'memu-iza-os',
          action: 'generateReports',
          settings: {},
          displayName: 'Generate Reports'
        }
      ]
    };

    return this.createFlow(flowData);
  }

  // =============================================================================
  // WEBHOOK MANAGEMENT
  // =============================================================================

  /**
   * Create webhook for flow
   */
  async createWebhook(flowId: string, webhookConfig: {
    name: string;
    url: string;
    events: string[];
  }): Promise<{ id: string; url: string }> {
    try {
      const response: AxiosResponse<{ id: string; url: string }> = await this.client.post(
        `/flows/${flowId}/webhooks`,
        webhookConfig
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to create webhook for flow ${flowId}:`, error);
      throw new Error(`Failed to create webhook for flow ${flowId}`);
    }
  }

  /**
   * Test connection to ActivePieces
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      console.error('ActivePieces connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let activePiecesService: ActivePiecesService | null = null;

/**
 * Get ActivePieces service instance
 */
export const getActivePiecesService = (): ActivePiecesService => {
  if (!activePiecesService) {
    const config: ActivePiecesConfig = {
      apiKey: process.env.REACT_APP_ACTIVEPIECES_API_KEY || '',
      baseUrl: process.env.REACT_APP_ACTIVEPIECES_BASE_URL || 'https://cloud.activepieces.com',
      projectId: process.env.REACT_APP_ACTIVEPIECES_PROJECT_ID || 'Q8X54IdSpd1RTFQxrAnKq'
    };

    if (!config.apiKey) {
      throw new Error('ActivePieces API key is required');
    }

    activePiecesService = new ActivePiecesService(config);
  }

  return activePiecesService;
};

export default ActivePiecesService;
