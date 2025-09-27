// Kagent Tools Integration for IZA OS
// Comprehensive DevOps and Infrastructure Management Toolkit

import axios from 'axios';
import { toast } from 'react-hot-toast';

const KAGENT_TOOLS_API_BASE_URL = 'http://localhost:8083'; // Kagent Tools default port

// Constants for default values and configuration
const DEFAULT_TTL_HOURS = 24;
const MAX_CACHE_SIZE = 1000;

interface KagentToolsConfig {
  baseUrl: string;
  kubeconfig?: string;
  prometheusUrl?: string;
  grafanaUrl?: string;
  grafanaApiKey?: string;
}

interface KubernetesResource {
  id: string;
  name: string;
  namespace: string;
  type: string;
  status: string;
  age: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  metadata: {
    creationTimestamp: string;
    resourceVersion: string;
    uid: string;
  };
}

interface HelmRelease {
  id: string;
  name: string;
  namespace: string;
  revision: number;
  updated: string;
  status: string;
  chart: string;
  appVersion: string;
  description: string;
}

interface IstioProxy {
  id: string;
  name: string;
  namespace: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  version: string;
  lastUpdated: string;
  configuration: Record<string, any>;
}

interface ArgoRollout {
  id: string;
  name: string;
  namespace: string;
  status: 'progressing' | 'paused' | 'degraded' | 'healthy';
  strategy: string;
  replicas: number;
  readyReplicas: number;
  updatedReplicas: number;
  availableReplicas: number;
  currentStepIndex: number;
  totalSteps: number;
}

interface CiliumStatus {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  version: string;
  features: string[];
  connectivity: {
    status: string;
    latency: number;
    throughput: number;
  };
}

interface PrometheusQuery {
  query: string;
  result: any[];
  timestamp: string;
  duration: number;
}

interface GrafanaDashboard {
  id: string;
  title: string;
  uid: string;
  url: string;
  tags: string[];
  folderId: number;
  folderTitle: string;
  isStarred: boolean;
  type: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
}

class KagentToolsService {
  private config: KagentToolsConfig;
  private kubernetesResources: Map<string, CacheEntry<KubernetesResource>> = new Map();
  private helmReleases: Map<string, CacheEntry<HelmRelease>> = new Map();
  private istioProxies: Map<string, CacheEntry<IstioProxy>> = new Map();
  private argoRollouts: Map<string, CacheEntry<ArgoRollout>> = new Map();
  private ciliumStatus: Map<string, CacheEntry<CiliumStatus>> = new Map();
  private prometheusQueries: Map<string, CacheEntry<PrometheusQuery>> = new Map();
  private grafanaDashboards: Map<string, CacheEntry<GrafanaDashboard>> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.config = {
      baseUrl: KAGENT_TOOLS_API_BASE_URL,
      kubeconfig: process.env.KUBECONFIG,
      prometheusUrl: process.env.PROMETHEUS_URL || 'http://localhost:9090',
      grafanaUrl: process.env.GRAFANA_URL || 'http://localhost:3000',
      grafanaApiKey: process.env.GRAFANA_API_KEY
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

    this.cleanupCacheEntries(this.kubernetesResources, now, ttlMs);
    this.cleanupCacheEntries(this.helmReleases, now, ttlMs);
    this.cleanupCacheEntries(this.istioProxies, now, ttlMs);
    this.cleanupCacheEntries(this.argoRollouts, now, ttlMs);
    this.cleanupCacheEntries(this.ciliumStatus, now, ttlMs);
    this.cleanupCacheEntries(this.prometheusQueries, now, ttlMs);
    this.cleanupCacheEntries(this.grafanaDashboards, now, ttlMs);
  }

  private cleanupCacheEntries<T>(cache: Map<string, CacheEntry<T>>, now: number, ttlMs: number): void {
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttlMs) {
        cache.delete(key);
      }
    }
  }

  private evictOldEntries(): void {
    this.evictCacheEntries(this.kubernetesResources);
    this.evictCacheEntries(this.helmReleases);
    this.evictCacheEntries(this.istioProxies);
    this.evictCacheEntries(this.argoRollouts);
    this.evictCacheEntries(this.ciliumStatus);
    this.evictCacheEntries(this.prometheusQueries);
    this.evictCacheEntries(this.grafanaDashboards);
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
      console.error('Kagent Tools health check failed:', error);
      return false;
    }
  }

  // 1. Kubernetes Tools
  async getKubernetesResources(resourceType: string, namespace?: string): Promise<KubernetesResource[]> {
    try {
      this.validateRequiredInput(resourceType, 'Resource type');

      const params = new URLSearchParams({ resource_type: resourceType });
      if (namespace) params.append('namespace', namespace);

      const response = await fetch(`${this.config.baseUrl}/api/v1/k8s/resources?${params}`);
      const data = await this.validateAndParseResponse<{ resources: KubernetesResource[] }>(response);
      
      // Cache the resources
      data.resources.forEach(resource => {
        this.updateCacheEntry(this.kubernetesResources, resource.id, resource);
      });
      
      return data.resources;
    } catch (error) {
      console.error(`Error fetching Kubernetes ${resourceType} resources:`, error);
      return Array.from(this.kubernetesResources.values()).map(entry => entry.data);
    }
  }

  async scaleKubernetesResource(resourceType: string, name: string, namespace: string, replicas: number): Promise<void> {
    try {
      this.validateRequiredInput(resourceType, 'Resource type');
      this.validateRequiredInput(name, 'Resource name');
      this.validateRequiredInput(namespace, 'Namespace');
      this.validateRequiredInput(replicas, 'Replicas');

      const response = await fetch(`${this.config.baseUrl}/api/v1/k8s/scale`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          resource_type: resourceType,
          name: name,
          namespace: namespace,
          replicas: replicas
        })
      });

      await this.validateAndParseResponse(response);
      toast.success(`Scaled ${resourceType}/${name} to ${replicas} replicas successfully!`);
    } catch (error) {
      console.error(`Error scaling ${resourceType}/${name}:`, error);
      toast.error(`Failed to scale ${resourceType}/${name}.`);
      throw error;
    }
  }

  async getKubernetesLogs(podName: string, namespace: string, container?: string): Promise<string> {
    try {
      this.validateRequiredInput(podName, 'Pod name');
      this.validateRequiredInput(namespace, 'Namespace');

      const params = new URLSearchParams({ 
        pod_name: podName, 
        namespace: namespace 
      });
      if (container) params.append('container', container);

      const response = await fetch(`${this.config.baseUrl}/api/v1/k8s/logs?${params}`);
      const data = await this.validateAndParseResponse<{ logs: string }>(response);
      
      return data.logs;
    } catch (error) {
      console.error(`Error fetching logs for pod ${podName}:`, error);
      toast.error(`Failed to fetch logs for pod ${podName}.`);
      throw error;
    }
  }

  // 2. Helm Tools
  async getHelmReleases(namespace?: string): Promise<HelmRelease[]> {
    try {
      const params = new URLSearchParams();
      if (namespace) params.append('namespace', namespace);

      const response = await fetch(`${this.config.baseUrl}/api/v1/helm/releases?${params}`);
      const data = await this.validateAndParseResponse<{ releases: HelmRelease[] }>(response);
      
      // Cache the releases
      data.releases.forEach(release => {
        this.updateCacheEntry(this.helmReleases, release.id, release);
      });
      
      return data.releases;
    } catch (error) {
      console.error('Error fetching Helm releases:', error);
      return Array.from(this.helmReleases.values()).map(entry => entry.data);
    }
  }

  async upgradeHelmRelease(releaseName: string, chart: string, namespace: string, values?: Record<string, any>): Promise<void> {
    try {
      this.validateRequiredInput(releaseName, 'Release name');
      this.validateRequiredInput(chart, 'Chart');
      this.validateRequiredInput(namespace, 'Namespace');

      const response = await fetch(`${this.config.baseUrl}/api/v1/helm/upgrade`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          release_name: releaseName,
          chart: chart,
          namespace: namespace,
          values: values || {}
        })
      });

      await this.validateAndParseResponse(response);
      toast.success(`Helm release ${releaseName} upgraded successfully!`);
    } catch (error) {
      console.error(`Error upgrading Helm release ${releaseName}:`, error);
      toast.error(`Failed to upgrade Helm release ${releaseName}.`);
      throw error;
    }
  }

  // 3. Istio Tools
  async getIstioProxyStatus(namespace?: string): Promise<IstioProxy[]> {
    try {
      const params = new URLSearchParams();
      if (namespace) params.append('namespace', namespace);

      const response = await fetch(`${this.config.baseUrl}/api/v1/istio/proxies?${params}`);
      const data = await this.validateAndParseResponse<{ proxies: IstioProxy[] }>(response);
      
      // Cache the proxies
      data.proxies.forEach(proxy => {
        this.updateCacheEntry(this.istioProxies, proxy.id, proxy);
      });
      
      return data.proxies;
    } catch (error) {
      console.error('Error fetching Istio proxy status:', error);
      return Array.from(this.istioProxies.values()).map(entry => entry.data);
    }
  }

  async installIstio(version?: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/istio/install`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          version: version || 'latest'
        })
      });

      await this.validateAndParseResponse(response);
      toast.success('Istio installed successfully!');
    } catch (error) {
      console.error('Error installing Istio:', error);
      toast.error('Failed to install Istio.');
      throw error;
    }
  }

  // 4. Argo Rollouts Tools
  async getArgoRollouts(namespace?: string): Promise<ArgoRollout[]> {
    try {
      const params = new URLSearchParams();
      if (namespace) params.append('namespace', namespace);

      const response = await fetch(`${this.config.baseUrl}/api/v1/argo/rollouts?${params}`);
      const data = await this.validateAndParseResponse<{ rollouts: ArgoRollout[] }>(response);
      
      // Cache the rollouts
      data.rollouts.forEach(rollout => {
        this.updateCacheEntry(this.argoRollouts, rollout.id, rollout);
      });
      
      return data.rollouts;
    } catch (error) {
      console.error('Error fetching Argo rollouts:', error);
      return Array.from(this.argoRollouts.values()).map(entry => entry.data);
    }
  }

  async promoteRollout(rolloutName: string, namespace: string): Promise<void> {
    try {
      this.validateRequiredInput(rolloutName, 'Rollout name');
      this.validateRequiredInput(namespace, 'Namespace');

      const response = await fetch(`${this.config.baseUrl}/api/v1/argo/promote`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          rollout_name: rolloutName,
          namespace: namespace
        })
      });

      await this.validateAndParseResponse(response);
      toast.success(`Argo rollout ${rolloutName} promoted successfully!`);
    } catch (error) {
      console.error(`Error promoting rollout ${rolloutName}:`, error);
      toast.error(`Failed to promote rollout ${rolloutName}.`);
      throw error;
    }
  }

  // 5. Cilium Tools
  async getCiliumStatus(): Promise<CiliumStatus> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/cilium/status`);
      const data = await this.validateAndParseResponse<CiliumStatus>(response);
      
      this.updateCacheEntry(this.ciliumStatus, 'main', data);
      return data;
    } catch (error) {
      console.error('Error fetching Cilium status:', error);
      const cached = this.getCacheEntry(this.ciliumStatus, 'main');
      if (cached) return cached;
      throw error;
    }
  }

  async installCilium(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/cilium/install`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      await this.validateAndParseResponse(response);
      toast.success('Cilium installed successfully!');
    } catch (error) {
      console.error('Error installing Cilium:', error);
      toast.error('Failed to install Cilium.');
      throw error;
    }
  }

  // 6. Prometheus Tools
  async executePrometheusQuery(query: string, range?: { start: string; end: string; step: string }): Promise<PrometheusQuery> {
    try {
      this.validateRequiredInput(query, 'Query');

      const response = await fetch(`${this.config.baseUrl}/api/v1/prometheus/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query: query,
          range: range
        })
      });

      const data = await this.validateAndParseResponse<PrometheusQuery>(response);
      this.updateCacheEntry(this.prometheusQueries, query, data);
      
      return data;
    } catch (error) {
      console.error(`Error executing Prometheus query: ${query}`, error);
      toast.error(`Failed to execute Prometheus query: ${query}`);
      throw error;
    }
  }

  // 7. Grafana Tools
  async getGrafanaDashboards(folderId?: number): Promise<GrafanaDashboard[]> {
    try {
      const params = new URLSearchParams();
      if (folderId) params.append('folder_id', folderId.toString());

      const response = await fetch(`${this.config.baseUrl}/api/v1/grafana/dashboards?${params}`);
      const data = await this.validateAndParseResponse<{ dashboards: GrafanaDashboard[] }>(response);
      
      // Cache the dashboards
      data.dashboards.forEach(dashboard => {
        this.updateCacheEntry(this.grafanaDashboards, dashboard.id, dashboard);
      });
      
      return data.dashboards;
    } catch (error) {
      console.error('Error fetching Grafana dashboards:', error);
      return Array.from(this.grafanaDashboards.values()).map(entry => entry.data);
    }
  }

  // IZA OS Specific Infrastructure Management
  async deployIZAOSInfrastructure(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/iza-os/deploy`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          components: [
            'kubernetes-cluster',
            'istio-service-mesh',
            'cilium-networking',
            'prometheus-monitoring',
            'grafana-dashboards',
            'argo-rollouts'
          ],
          namespace: 'iza-os',
          replicas: 3
        })
      });

      await this.validateAndParseResponse(response);
      toast.success('IZA OS infrastructure deployed successfully!');
    } catch (error) {
      console.error('Error deploying IZA OS infrastructure:', error);
      toast.error('Failed to deploy IZA OS infrastructure.');
      throw error;
    }
  }

  async scaleIZAOSAgents(replicas: number): Promise<void> {
    try {
      this.validateRequiredInput(replicas, 'Replicas');

      const response = await fetch(`${this.config.baseUrl}/api/v1/iza-os/scale-agents`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          replicas: replicas,
          namespace: 'iza-os'
        })
      });

      await this.validateAndParseResponse(response);
      toast.success(`IZA OS agents scaled to ${replicas} replicas successfully!`);
    } catch (error) {
      console.error(`Error scaling IZA OS agents to ${replicas}:`, error);
      toast.error(`Failed to scale IZA OS agents to ${replicas}.`);
      throw error;
    }
  }

  async monitorIZAOSHealth(): Promise<{
    kubernetes: { status: string; pods: number; services: number };
    istio: { status: string; proxies: number; healthy: number };
    cilium: { status: string; connectivity: string };
    prometheus: { status: string; targets: number; queries: number };
    grafana: { status: string; dashboards: number };
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/iza-os/health`);
      const data = await this.validateAndParseResponse<{
        kubernetes: { status: string; pods: number; services: number };
        istio: { status: string; proxies: number; healthy: number };
        cilium: { status: string; connectivity: string };
        prometheus: { status: string; targets: number; queries: number };
        grafana: { status: string; dashboards: number };
      }>(response);
      
      return data;
    } catch (error) {
      console.error('Error monitoring IZA OS health:', error);
      throw error;
    }
  }

  // Statistics and Analytics
  async getSystemStatistics(): Promise<{
    kubernetes: { totalResources: number; namespaces: number; pods: number };
    helm: { totalReleases: number; activeReleases: number };
    istio: { totalProxies: number; healthyProxies: number };
    argo: { totalRollouts: number; activeRollouts: number };
    cilium: { status: string; features: number };
    prometheus: { totalQueries: number; activeTargets: number };
    grafana: { totalDashboards: number; starredDashboards: number };
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`);
      const data = await this.validateAndParseResponse<{
        kubernetes: { total_resources: number; namespaces: number; pods: number };
        helm: { total_releases: number; active_releases: number };
        istio: { total_proxies: number; healthy_proxies: number };
        argo: { total_rollouts: number; active_rollouts: number };
        cilium: { status: string; features: number };
        prometheus: { total_queries: number; active_targets: number };
        grafana: { total_dashboards: number; starred_dashboards: number };
      }>(response);

      return {
        kubernetes: {
          totalResources: data.kubernetes.total_resources || 0,
          namespaces: data.kubernetes.namespaces || 0,
          pods: data.kubernetes.pods || 0
        },
        helm: {
          totalReleases: data.helm.total_releases || 0,
          activeReleases: data.helm.active_releases || 0
        },
        istio: {
          totalProxies: data.istio.total_proxies || 0,
          healthyProxies: data.istio.healthy_proxies || 0
        },
        argo: {
          totalRollouts: data.argo.total_rollouts || 0,
          activeRollouts: data.argo.active_rollouts || 0
        },
        cilium: {
          status: data.cilium.status || 'unknown',
          features: data.cilium.features || 0
        },
        prometheus: {
          totalQueries: data.prometheus.total_queries || 0,
          activeTargets: data.prometheus.active_targets || 0
        },
        grafana: {
          totalDashboards: data.grafana.total_dashboards || 0,
          starredDashboards: data.grafana.starred_dashboards || 0
        }
      };
    } catch (error) {
      console.error('Error fetching system statistics:', error);
      
      // Return cached data if API fails
      const k8sResources = Array.from(this.kubernetesResources.values()).map(entry => entry.data);
      const helmReleases = Array.from(this.helmReleases.values()).map(entry => entry.data);
      const istioProxies = Array.from(this.istioProxies.values()).map(entry => entry.data);
      const argoRollouts = Array.from(this.argoRollouts.values()).map(entry => entry.data);
      const prometheusQueries = Array.from(this.prometheusQueries.values()).map(entry => entry.data);
      const grafanaDashboards = Array.from(this.grafanaDashboards.values()).map(entry => entry.data);

      return {
        kubernetes: {
          totalResources: k8sResources.length,
          namespaces: new Set(k8sResources.map(r => r.namespace)).size,
          pods: k8sResources.filter(r => r.type === 'Pod').length
        },
        helm: {
          totalReleases: helmReleases.length,
          activeReleases: helmReleases.filter(r => r.status === 'deployed').length
        },
        istio: {
          totalProxies: istioProxies.length,
          healthyProxies: istioProxies.filter(p => p.status === 'healthy').length
        },
        argo: {
          totalRollouts: argoRollouts.length,
          activeRollouts: argoRollouts.filter(r => r.status === 'progressing').length
        },
        cilium: {
          status: 'unknown',
          features: 0
        },
        prometheus: {
          totalQueries: prometheusQueries.length,
          activeTargets: 0
        },
        grafana: {
          totalDashboards: grafanaDashboards.length,
          starredDashboards: grafanaDashboards.filter(d => d.isStarred).length
        }
      };
    }
  }

  // Configuration Management
  async updateConfiguration(newConfig: Partial<KagentToolsConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // Clear caches when configuration changes
    this.kubernetesResources.clear();
    this.helmReleases.clear();
    this.istioProxies.clear();
    this.argoRollouts.clear();
    this.ciliumStatus.clear();
    this.prometheusQueries.clear();
    this.grafanaDashboards.clear();
  }

  // Headers management
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Security check: Only add API keys in server-side environments
    const isServerSide = typeof window === 'undefined' || typeof process !== 'undefined';
    
    if (isServerSide) {
      if (this.config.grafanaApiKey) {
        headers['Authorization'] = `Bearer ${this.config.grafanaApiKey}`;
      }
    } else {
      console.warn('KagentToolsService: API keys are not included in client-side requests. Ensure secure backend proxy is configured.');
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
export const kagentToolsService = new KagentToolsService();
export { KagentToolsService };
export default kagentToolsService;
