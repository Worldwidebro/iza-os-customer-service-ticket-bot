// TruffleHog Integration for IZA OS
// Find, verify, and analyze leaked credentials

interface TruffleHogConfig {
  baseUrl: string
  apiKey?: string
  githubToken?: string
  gitlabToken?: string
  awsAccessKey?: string
  awsSecretKey?: string
  webhookUrl?: string
}

interface CredentialScan {
  id: string
  source: string
  type: 'git' | 'filesystem' | 's3' | 'github' | 'gitlab' | 'circleci' | 'jenkins' | 'docker'
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  results: CredentialResult[]
  summary: {
    totalFound: number
    verified: number
    unverified: number
    falsePositives: number
  }
}

interface CredentialResult {
  id: string
  detector: string
  detectorType: 'secret' | 'key' | 'token' | 'password' | 'certificate'
  verified: boolean
  verificationStatus: 'verified' | 'unverified' | 'verification_failed' | 'pending'
  severity: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  location: {
    file: string
    line: number
    column: number
    commit?: string
    branch?: string
  }
  raw: string
  redacted: string
  context: {
    before: string
    after: string
  }
  metadata: {
    service?: string
    account?: string
    region?: string
    resource?: string
    permissions?: string[]
  }
  remediation: {
    action: string
    description: string
    priority: 'immediate' | 'urgent' | 'high' | 'medium' | 'low'
  }
}

interface ScanTarget {
  id: string
  name: string
  type: 'repository' | 'filesystem' | 'cloud_storage' | 'ci_cd'
  path: string
  credentials?: {
    type: string
    config: Record<string, any>
  }
  lastScanned?: string
  scanFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  enabled: boolean
}

interface SecurityPolicy {
  id: string
  name: string
  description: string
  rules: {
    detectorTypes: string[]
    severityThreshold: 'critical' | 'high' | 'medium' | 'low'
    requireVerification: boolean
    autoRemediation: boolean
    notificationChannels: string[]
  }
  targets: string[]
  enabled: boolean
}

interface SecurityAlert {
  id: string
  credentialId: string
  scanId: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive'
  title: string
  description: string
  detectedAt: string
  acknowledgedAt?: string
  resolvedAt?: string
  assignedTo?: string
  remediation: string
  tags: string[]
}

class TruffleHogService {
  private config: TruffleHogConfig
  private scans: Map<string, CredentialScan> = new Map()
  private targets: Map<string, ScanTarget> = new Map()
  private policies: Map<string, SecurityPolicy> = new Map()
  private alerts: Map<string, SecurityAlert> = new Map()

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:8080' // TruffleHog API server
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

  // Credential Scanning
  async scanRepository(config: {
    repository: string
    branch?: string
    sinceCommit?: string
    detectors?: string[]
    verify?: boolean
  }): Promise<CredentialScan> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/scans`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 'git',
          repository: config.repository,
          branch: config.branch || 'main',
          since_commit: config.sinceCommit,
          detectors: config.detectors || ['all'],
          verify: config.verify ?? true
        })
      })

      const data = await response.json()
      const scan: CredentialScan = {
        id: data.id,
        source: config.repository,
        type: 'git',
        status: 'running',
        startedAt: new Date().toISOString(),
        results: [],
        summary: {
          totalFound: 0,
          verified: 0,
          unverified: 0,
          falsePositives: 0
        }
      }

      this.scans.set(scan.id, scan)
      return scan
    } catch (error) {
      console.error('Error starting repository scan:', error)
      throw error
    }
  }

  async scanFilesystem(config: {
    path: string
    detectors?: string[]
    verify?: boolean
    exclude?: string[]
  }): Promise<CredentialScan> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/scans`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 'filesystem',
          path: config.path,
          detectors: config.detectors || ['all'],
          verify: config.verify ?? true,
          exclude: config.exclude || []
        })
      })

      const data = await response.json()
      const scan: CredentialScan = {
        id: data.id,
        source: config.path,
        type: 'filesystem',
        status: 'running',
        startedAt: new Date().toISOString(),
        results: [],
        summary: {
          totalFound: 0,
          verified: 0,
          unverified: 0,
          falsePositives: 0
        }
      }

      this.scans.set(scan.id, scan)
      return scan
    } catch (error) {
      console.error('Error starting filesystem scan:', error)
      throw error
    }
  }

  async scanS3(config: {
    bucket: string
    region?: string
    roleArn?: string
    detectors?: string[]
    verify?: boolean
  }): Promise<CredentialScan> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/scans`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 's3',
          bucket: config.bucket,
          region: config.region || 'us-east-1',
          role_arn: config.roleArn,
          detectors: config.detectors || ['all'],
          verify: config.verify ?? true
        })
      })

      const data = await response.json()
      const scan: CredentialScan = {
        id: data.id,
        source: config.bucket,
        type: 's3',
        status: 'running',
        startedAt: new Date().toISOString(),
        results: [],
        summary: {
          totalFound: 0,
          verified: 0,
          unverified: 0,
          falsePositives: 0
        }
      }

      this.scans.set(scan.id, scan)
      return scan
    } catch (error) {
      console.error('Error starting S3 scan:', error)
      throw error
    }
  }

  async getScan(scanId: string): Promise<CredentialScan | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/scans/${scanId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.scan
    } catch (error) {
      console.error(`Error fetching scan ${scanId}:`, error)
      return this.scans.get(scanId) || null
    }
  }

  async getScanResults(scanId: string): Promise<CredentialResult[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/scans/${scanId}/results`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error(`Error fetching scan results ${scanId}:`, error)
      return []
    }
  }

  // Credential Verification
  async verifyCredential(credentialId: string): Promise<{
    verified: boolean
    status: string
    details?: any
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/credentials/${credentialId}/verify`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return {
        verified: data.verified,
        status: data.status,
        details: data.details
      }
    } catch (error) {
      console.error(`Error verifying credential ${credentialId}:`, error)
      return { verified: false, status: 'verification_failed' }
    }
  }

  async analyzeCredential(credentialId: string): Promise<{
    permissions: string[]
    resources: string[]
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    recommendations: string[]
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/credentials/${credentialId}/analyze`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return {
        permissions: data.permissions || [],
        resources: data.resources || [],
        riskLevel: data.risk_level || 'medium',
        recommendations: data.recommendations || []
      }
    } catch (error) {
      console.error(`Error analyzing credential ${credentialId}:`, error)
      return {
        permissions: [],
        resources: [],
        riskLevel: 'medium',
        recommendations: ['Manual review required']
      }
    }
  }

  // Scan Targets Management
  async addScanTarget(config: {
    name: string
    type: 'repository' | 'filesystem' | 'cloud_storage' | 'ci_cd'
    path: string
    credentials?: {
      type: string
      config: Record<string, any>
    }
    scanFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  }): Promise<ScanTarget> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/targets`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          type: config.type,
          path: config.path,
          credentials: config.credentials,
          scan_frequency: config.scanFrequency
        })
      })

      const data = await response.json()
      const target: ScanTarget = {
        id: data.id,
        name: config.name,
        type: config.type,
        path: config.path,
        credentials: config.credentials,
        scanFrequency: config.scanFrequency,
        enabled: true
      }

      this.targets.set(target.id, target)
      return target
    } catch (error) {
      console.error('Error adding scan target:', error)
      throw error
    }
  }

  async getScanTargets(): Promise<ScanTarget[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/targets`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.targets || []
    } catch (error) {
      console.error('Error fetching scan targets:', error)
      return Array.from(this.targets.values())
    }
  }

  // Security Policies
  async createSecurityPolicy(config: {
    name: string
    description: string
    rules: {
      detectorTypes: string[]
      severityThreshold: 'critical' | 'high' | 'medium' | 'low'
      requireVerification: boolean
      autoRemediation: boolean
      notificationChannels: string[]
    }
    targets: string[]
  }): Promise<SecurityPolicy> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/policies`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          rules: config.rules,
          targets: config.targets
        })
      })

      const data = await response.json()
      const policy: SecurityPolicy = {
        id: data.id,
        name: config.name,
        description: config.description,
        rules: config.rules,
        targets: config.targets,
        enabled: true
      }

      this.policies.set(policy.id, policy)
      return policy
    } catch (error) {
      console.error('Error creating security policy:', error)
      throw error
    }
  }

  // Security Alerts
  async getSecurityAlerts(filters?: {
    severity?: string
    status?: string
    detector?: string
    dateRange?: { start: string; end: string }
  }): Promise<SecurityAlert[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.severity) params.append('severity', filters.severity)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.detector) params.append('detector', filters.detector)
      if (filters?.dateRange) {
        params.append('start_date', filters.dateRange.start)
        params.append('end_date', filters.dateRange.end)
      }

      const response = await fetch(`${this.config.baseUrl}/api/v1/alerts?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.alerts || []
    } catch (error) {
      console.error('Error fetching security alerts:', error)
      return Array.from(this.alerts.values())
    }
  }

  async updateAlertStatus(alertId: string, status: string, assignedTo?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/alerts/${alertId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          status,
          assigned_to: assignedTo,
          updated_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        const alert = this.alerts.get(alertId)
        if (alert) {
          alert.status = status as any
          if (assignedTo) alert.assignedTo = assignedTo
          if (status === 'acknowledged') alert.acknowledgedAt = new Date().toISOString()
          if (status === 'resolved') alert.resolvedAt = new Date().toISOString()
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error updating alert ${alertId}:`, error)
      return false
    }
  }

  // IZA OS Specific Security Scans
  async scanIZAOSEcosystem(): Promise<CredentialScan[]> {
    const scans: CredentialScan[] = []
    
    // Scan IZA OS repositories
    const repositories = [
      'iza-os-main',
      'iza-os-agents',
      'iza-os-robotics',
      'iza-os-automation',
      'iza-os-analytics'
    ]

    for (const repo of repositories) {
      try {
        const scan = await this.scanRepository({
          repository: `https://github.com/iza-os/${repo}`,
          branch: 'main',
          verify: true
        })
        scans.push(scan)
      } catch (error) {
        console.error(`Error scanning ${repo}:`, error)
      }
    }

    // Scan IZA OS infrastructure
    try {
      const infrastructureScan = await this.scanS3({
        bucket: 'iza-os-infrastructure',
        region: 'us-east-1',
        verify: true
      })
      scans.push(infrastructureScan)
    } catch (error) {
      console.error('Error scanning infrastructure:', error)
    }

    return scans
  }

  // IZA OS Security Policies
  async createIZAOSSecurityPolicies(): Promise<SecurityPolicy[]> {
    const policies = [
      {
        name: 'IZA OS Critical Secrets Policy',
        description: 'Policy for critical secrets in IZA OS ecosystem',
        rules: {
          detectorTypes: ['aws', 'github', 'docker', 'kubernetes'],
          severityThreshold: 'critical',
          requireVerification: true,
          autoRemediation: false,
          notificationChannels: ['slack', 'email', 'pagerduty']
        },
        targets: ['iza-os-main', 'iza-os-infrastructure']
      },
      {
        name: 'IZA OS Development Secrets Policy',
        description: 'Policy for development secrets in IZA OS',
        rules: {
          detectorTypes: ['api_key', 'password', 'token'],
          severityThreshold: 'high',
          requireVerification: true,
          autoRemediation: true,
          notificationChannels: ['slack']
        },
        targets: ['iza-os-agents', 'iza-os-robotics']
      },
      {
        name: 'IZA OS Production Secrets Policy',
        description: 'Policy for production secrets in IZA OS',
        rules: {
          detectorTypes: ['all'],
          severityThreshold: 'medium',
          requireVerification: true,
          autoRemediation: false,
          notificationChannels: ['email', 'slack']
        },
        targets: ['iza-os-production']
      }
    ]

    const createdPolicies: SecurityPolicy[] = []
    
    for (const policyConfig of policies) {
      try {
        const policy = await this.createSecurityPolicy(policyConfig)
        createdPolicies.push(policy)
      } catch (error) {
        console.error(`Error creating ${policyConfig.name}:`, error)
      }
    }

    return createdPolicies
  }

  // System Statistics
  async getSystemStatistics(): Promise<{
    totalScans: number
    activeScans: number
    totalCredentials: number
    verifiedCredentials: number
    criticalAlerts: number
    highAlerts: number
    mediumAlerts: number
    lowAlerts: number
    averageScanTime: number
    scanSuccessRate: number
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return {
        totalScans: data.total_scans || 0,
        activeScans: data.active_scans || 0,
        totalCredentials: data.total_credentials || 0,
        verifiedCredentials: data.verified_credentials || 0,
        criticalAlerts: data.critical_alerts || 0,
        highAlerts: data.high_alerts || 0,
        mediumAlerts: data.medium_alerts || 0,
        lowAlerts: data.low_alerts || 0,
        averageScanTime: data.average_scan_time || 0,
        scanSuccessRate: data.scan_success_rate || 0
      }
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      const scans = Array.from(this.scans.values())
      const alerts = Array.from(this.alerts.values())
      
      return {
        totalScans: scans.length,
        activeScans: scans.filter(s => s.status === 'running').length,
        totalCredentials: scans.reduce((sum, s) => sum + s.results.length, 0),
        verifiedCredentials: scans.reduce((sum, s) => sum + s.results.filter(r => r.verified).length, 0),
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        highAlerts: alerts.filter(a => a.severity === 'high').length,
        mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
        lowAlerts: alerts.filter(a => a.severity === 'low').length,
        averageScanTime: 0,
        scanSuccessRate: 0
      }
    }
  }

  // System Overview
  async getSystemOverview(): Promise<{
    health: boolean
    totalScans: number
    activeScans: number
    totalCredentials: number
    criticalAlerts: number
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
        totalScans: statistics.totalScans,
        activeScans: statistics.activeScans,
        totalCredentials: statistics.totalCredentials,
        criticalAlerts: statistics.criticalAlerts,
        systemResources: {
          cpuUsage: 25, // Mock data
          memoryUsage: 35,
          diskUsage: 15
        }
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        totalScans: 0,
        activeScans: 0,
        totalCredentials: 0,
        criticalAlerts: 0,
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

    if (this.config.gitlabToken) {
      headers['X-GitLab-Token'] = this.config.gitlabToken
    }

    return headers
  }
}

// Export singleton instance
export const truffleHogService = new TruffleHogService()
export default truffleHogService
