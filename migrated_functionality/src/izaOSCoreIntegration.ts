// IZA OS Core Repository Integration Service
// 10X Faster Integration with Core Repositories

interface CoreRepository {
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'pending';
  integration_level: number;
  capabilities: string[];
}

interface IZAOSConfig {
  ecosystem_value: number;
  revenue_pipeline: number;
  automation_level: number;
  core_repositories: Record<string, string>;
  version: string;
  architecture: string;
}

class IZAOSCoreIntegration {
  private baseUrl: string;
  private coreRepositories: CoreRepository[] = [];
  private izaOSConfig: IZAOSConfig | null = null;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  // Core Repository Integration Methods
  async getCoreRepositories(): Promise<CoreRepository[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/core-repositories`);
      const data = await response.json();
      
      this.coreRepositories = Object.entries(data.repositories).map(([name, url]) => ({
        name,
        url: url as string,
        status: 'active',
        integration_level: 10,
        capabilities: this.getCapabilitiesForRepo(name)
      }));

      return this.coreRepositories;
    } catch (error) {
      console.error('Error fetching core repositories:', error);
      return [];
    }
  }

  async getIZAOSConfig(): Promise<IZAOSConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/iza-os-config`);
      this.izaOSConfig = await response.json();
      return this.izaOSConfig;
    } catch (error) {
      console.error('Error fetching IZA OS config:', error);
      return null;
    }
  }

  async getEcosystemStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ecosystem`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching ecosystem status:', error);
      return null;
    }
  }

  async getAgentSystem(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/agents`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching agent system:', error);
      return null;
    }
  }

  async getPerformanceMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/metrics`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return null;
    }
  }

  async integrateRepository(repoName: string, repoUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/integrate-repository`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          url: repoUrl
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error integrating repository:', error);
      return false;
    }
  }

  // Repository-specific capabilities
  private getCapabilitiesForRepo(repoName: string): string[] {
    const capabilities: Record<string, string[]> = {
      'codex': ['code_generation', 'ai_assistance', 'openai_integration'],
      'mcp_registry': ['model_context_protocol', 'tool_execution', 'agent_communication'],
      'filebrowser': ['file_management', 'browser_interface', 'data_organization'],
      'filesync': ['file_synchronization', 'data_sync', 'cross_platform'],
      'pathway': ['streaming_data', 'real_time_processing', 'data_pipelines'],
      'bitnet': ['efficient_ai', 'model_optimization', 'microsoft_integration'],
      'codebuff': ['code_intelligence', 'code_analysis', 'ai_coding_assistant']
    };

    return capabilities[repoName] || ['general_integration'];
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Get integration performance score
  getIntegrationPerformance(): number {
    return this.coreRepositories.length * 10; // 10 points per repository
  }

  // Get ecosystem value
  getEcosystemValue(): number {
    return this.izaOSConfig?.ecosystem_value || 0;
  }

  // Get automation level
  getAutomationLevel(): number {
    return this.izaOSConfig?.automation_level || 0;
  }
}

// Export singleton instance
export const izaOSCoreIntegration = new IZAOSCoreIntegration();
export type { CoreRepository, IZAOSConfig };
