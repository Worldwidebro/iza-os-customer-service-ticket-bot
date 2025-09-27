// Nightingale Monitoring Service for IZA OS
// Integrates with Nightingale monitoring and alerting system

interface NightingaleConfig {
  baseUrl: string
  apiKey?: string
  businessGroup: string
}

interface AlertRule {
  id: string
  name: string
  expression: string
  severity: 'critical' | 'warning' | 'info'
  status: 'enabled' | 'disabled'
  description: string
}

interface AlertEvent {
  id: string
  ruleId: string
  ruleName: string
  severity: string
  status: 'firing' | 'resolved'
  timestamp: string
  labels: Record<string, string>
  annotations: Record<string, string>
}

interface MetricData {
  metric: string
  labels: Record<string, string>
  values: Array<[number, string]> // [timestamp, value]
}

interface Dashboard {
  id: string
  name: string
  description: string
  panels: Array<{
    id: string
    title: string
    type: string
    targets: Array<{
      expr: string
      legendFormat?: string
    }>
  }>
}

class NightingaleService {
  private config: NightingaleConfig

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:17000', // Default Nightingale port
      businessGroup: 'iza-os-ecosystem'
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Get all alert rules
  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/alert-rules`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching alert rules:', error)
      return []
    }
  }

  // Get active alerts
  async getActiveAlerts(): Promise<AlertEvent[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/alerts?status=firing`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching active alerts:', error)
      return []
    }
  }

  // Get metrics for specific queries
  async getMetrics(query: string, startTime?: number, endTime?: number): Promise<MetricData[]> {
    try {
      const params = new URLSearchParams({
        query,
        ...(startTime && { start: startTime.toString() }),
        ...(endTime && { end: endTime.toString() })
      })

      const response = await fetch(`${this.config.baseUrl}/api/v1/query?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching metrics:', error)
      return []
    }
  }

  // Get dashboards
  async getDashboards(): Promise<Dashboard[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/dashboards`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching dashboards:', error)
      return []
    }
  }

  // Create alert rule
  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/alert-rules`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(rule)
      })
      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Error creating alert rule:', error)
      throw error
    }
  }

  // Update alert rule
  async updateAlertRule(id: string, rule: Partial<AlertRule>): Promise<AlertRule> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/alert-rules/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(rule)
      })
      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Error updating alert rule:', error)
      throw error
    }
  }

  // Delete alert rule
  async deleteAlertRule(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/alert-rules/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })
      return response.ok
    } catch (error) {
      console.error('Error deleting alert rule:', error)
      return false
    }
  }

  // Get IZA OS specific metrics
  async getIZAOSMetrics(): Promise<{
    systemHealth: any
    agentMetrics: any
    businessMetrics: any
    frameworkMetrics: any
  }> {
    try {
      const [systemHealth, agentMetrics, businessMetrics, frameworkMetrics] = await Promise.all([
        this.getMetrics('iza_os_system_health'),
        this.getMetrics('iza_os_agent_count'),
        this.getMetrics('iza_os_business_revenue'),
        this.getMetrics('iza_os_framework_status')
      ])

      return {
        systemHealth,
        agentMetrics,
        businessMetrics,
        frameworkMetrics
      }
    } catch (error) {
      console.error('Error fetching IZA OS metrics:', error)
      return {
        systemHealth: [],
        agentMetrics: [],
        businessMetrics: [],
        frameworkMetrics: []
      }
    }
  }

  // Create IZA OS specific alert rules
  async createIZAOSAlertRules(): Promise<void> {
    const rules = [
      {
        name: 'IZA OS System Down',
        expression: 'iza_os_system_health == 0',
        severity: 'critical' as const,
        status: 'enabled' as const,
        description: 'IZA OS system is down'
      },
      {
        name: 'Agent Count Below Threshold',
        expression: 'iza_os_agent_count < 1800',
        severity: 'warning' as const,
        status: 'enabled' as const,
        description: 'Agent count is below expected threshold'
      },
      {
        name: 'Revenue Pipeline Drop',
        expression: 'iza_os_business_revenue < 8000000',
        severity: 'warning' as const,
        status: 'enabled' as const,
        description: 'Revenue pipeline has dropped significantly'
      },
      {
        name: 'ROMA Framework Offline',
        expression: 'iza_os_roma_status == 0',
        severity: 'critical' as const,
        status: 'enabled' as const,
        description: 'ROMA framework is offline'
      },
      {
        name: 'OpenPI Framework Offline',
        expression: 'iza_os_openpi_status == 0',
        severity: 'critical' as const,
        status: 'enabled' as const,
        description: 'OpenPI framework is offline'
      },
      {
        name: 'AutoAgent Framework Offline',
        expression: 'iza_os_autoagent_status == 0',
        severity: 'critical' as const,
        status: 'enabled' as const,
        description: 'AutoAgent framework is offline'
      }
    ]

    for (const rule of rules) {
      try {
        await this.createAlertRule(rule)
      } catch (error) {
        console.error(`Error creating alert rule ${rule.name}:`, error)
      }
    }
  }

  // Get system overview
  async getSystemOverview(): Promise<{
    health: boolean
    activeAlerts: number
    totalRules: number
    criticalAlerts: number
    warningAlerts: number
  }> {
    try {
      const [health, alerts, rules] = await Promise.all([
        this.checkHealth(),
        this.getActiveAlerts(),
        this.getAlertRules()
      ])

      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length
      const warningAlerts = alerts.filter(alert => alert.severity === 'warning').length

      return {
        health,
        activeAlerts: alerts.length,
        totalRules: rules.length,
        criticalAlerts,
        warningAlerts
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        activeAlerts: 0,
        totalRules: 0,
        criticalAlerts: 0,
        warningAlerts: 0
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
export const nightingaleService = new NightingaleService()
export default nightingaleService
