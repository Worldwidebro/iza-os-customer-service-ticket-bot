// FileSync Integration for IZA OS
// Data synchronization for "Optimize Through Learning" system

interface FileSyncConfig {
  baseUrl: string
  apiKey?: string
  syncInterval: number
  maxFileSize: number
  supportedFormats: string[]
  compressionEnabled: boolean
}

interface SyncJob {
  id: string
  name: string
  source: string
  destination: string
  type: 'file' | 'directory' | 'database' | 'api'
  status: 'active' | 'paused' | 'error' | 'completed'
  lastSync: string
  nextSync: string
  filesProcessed: number
  totalFiles: number
  syncTime: number
  errorCount: number
  lastError?: string
}

interface FileMetadata {
  id: string
  name: string
  path: string
  size: number
  type: string
  checksum: string
  lastModified: string
  syncStatus: 'synced' | 'pending' | 'error' | 'conflict'
  version: number
  tags: string[]
}

interface SyncRule {
  id: string
  name: string
  pattern: string
  action: 'include' | 'exclude' | 'transform'
  priority: number
  enabled: boolean
  description: string
}

interface SyncConflict {
  id: string
  fileId: string
  fileName: string
  conflictType: 'version' | 'permission' | 'content' | 'metadata'
  sourceVersion: any
  destinationVersion: any
  resolution: 'manual' | 'source' | 'destination' | 'merge'
  createdAt: string
  resolvedAt?: string
}

class FileSyncService {
  private config: FileSyncConfig
  private syncJobs: Map<string, SyncJob> = new Map()
  private fileMetadata: Map<string, FileMetadata> = new Map()
  private syncRules: Map<string, SyncRule> = new Map()
  private syncConflicts: Map<string, SyncConflict> = new Map()

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:8012', // FileSync API server
      syncInterval: 300000, // 5 minutes
      maxFileSize: 100 * 1024 * 1024, // 100MB
      supportedFormats: ['txt', 'json', 'csv', 'xml', 'yaml', 'md', 'log'],
      compressionEnabled: true
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

  // Sync Job Management
  async createSyncJob(config: {
    name: string
    source: string
    destination: string
    type: 'file' | 'directory' | 'database' | 'api'
    schedule?: string
    rules?: string[]
  }): Promise<SyncJob> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/sync-jobs`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          source: config.source,
          destination: config.destination,
          type: config.type,
          schedule: config.schedule || '*/5 * * * *', // Every 5 minutes
          rules: config.rules || []
        })
      })

      const data = await response.json()
      const job: SyncJob = {
        id: data.id,
        name: config.name,
        source: config.source,
        destination: config.destination,
        type: config.type,
        status: 'active',
        lastSync: new Date().toISOString(),
        nextSync: new Date(Date.now() + this.config.syncInterval).toISOString(),
        filesProcessed: 0,
        totalFiles: 0,
        syncTime: 0,
        errorCount: 0
      }

      this.syncJobs.set(job.id, job)
      return job
    } catch (error) {
      console.error('Error creating sync job:', error)
      throw error
    }
  }

  async getSyncJobs(): Promise<SyncJob[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/sync-jobs`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.jobs || []
    } catch (error) {
      console.error('Error fetching sync jobs:', error)
      return Array.from(this.syncJobs.values())
    }
  }

  async startSyncJob(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/sync-jobs/${jobId}/start`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const job = this.syncJobs.get(jobId)
        if (job) {
          job.status = 'active'
          job.lastSync = new Date().toISOString()
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error starting sync job ${jobId}:`, error)
      return false
    }
  }

  async pauseSyncJob(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/sync-jobs/${jobId}/pause`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const job = this.syncJobs.get(jobId)
        if (job) {
          job.status = 'paused'
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error pausing sync job ${jobId}:`, error)
      return false
    }
  }

  async stopSyncJob(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/sync-jobs/${jobId}/stop`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const job = this.syncJobs.get(jobId)
        if (job) {
          job.status = 'completed'
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error stopping sync job ${jobId}:`, error)
      return false
    }
  }

  // File Metadata Management
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/files/${fileId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        return data.file
      }
      return null
    } catch (error) {
      console.error(`Error fetching file metadata ${fileId}:`, error)
      return null
    }
  }

  async updateFileMetadata(fileId: string, updates: Partial<FileMetadata>): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/files/${fileId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const file = this.fileMetadata.get(fileId)
        if (file) {
          Object.assign(file, updates)
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error updating file metadata ${fileId}:`, error)
      return false
    }
  }

  async searchFiles(query: {
    name?: string
    type?: string
    tags?: string[]
    syncStatus?: string
    lastModified?: {
      from: string
      to: string
    }
  }): Promise<FileMetadata[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/files/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(query)
      })

      const data = await response.json()
      return data.files || []
    } catch (error) {
      console.error('Error searching files:', error)
      return []
    }
  }

  // Sync Rules Management
  async createSyncRule(config: {
    name: string
    pattern: string
    action: 'include' | 'exclude' | 'transform'
    priority: number
    description?: string
  }): Promise<SyncRule> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/sync-rules`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          pattern: config.pattern,
          action: config.action,
          priority: config.priority,
          description: config.description || '',
          enabled: true
        })
      })

      const data = await response.json()
      const rule: SyncRule = {
        id: data.id,
        name: config.name,
        pattern: config.pattern,
        action: config.action,
        priority: config.priority,
        enabled: true,
        description: config.description || ''
      }

      this.syncRules.set(rule.id, rule)
      return rule
    } catch (error) {
      console.error('Error creating sync rule:', error)
      throw error
    }
  }

  async getSyncRules(): Promise<SyncRule[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/sync-rules`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.rules || []
    } catch (error) {
      console.error('Error fetching sync rules:', error)
      return Array.from(this.syncRules.values())
    }
  }

  // Sync Conflict Management
  async getSyncConflicts(): Promise<SyncConflict[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/conflicts`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.conflicts || []
    } catch (error) {
      console.error('Error fetching sync conflicts:', error)
      return Array.from(this.syncConflicts.values())
    }
  }

  async resolveConflict(conflictId: string, resolution: 'source' | 'destination' | 'merge'): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ resolution })
      })

      if (response.ok) {
        const conflict = this.syncConflicts.get(conflictId)
        if (conflict) {
          conflict.resolution = resolution
          conflict.resolvedAt = new Date().toISOString()
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error resolving conflict ${conflictId}:`, error)
      return false
    }
  }

  // IZA OS Specific Sync Jobs
  async createIZAOSSyncJobs(): Promise<SyncJob[]> {
    const izaJobs = [
      {
        name: 'IZA OS Agent Configurations',
        source: 'iza-os-configs',
        destination: 'iza-os-backup-configs',
        type: 'directory' as const,
        schedule: '0 */6 * * *', // Every 6 hours
        rules: ['include:*.json', 'include:*.yaml', 'exclude:*.tmp']
      },
      {
        name: 'IZA OS Business Metrics',
        source: 'iza-os-metrics-api',
        destination: 'iza-os-metrics-db',
        type: 'api' as const,
        schedule: '*/15 * * * *', // Every 15 minutes
        rules: ['include:metrics', 'transform:normalize']
      },
      {
        name: 'IZA OS Learning Data',
        source: 'iza-os-learning-files',
        destination: 'iza-os-learning-backup',
        type: 'directory' as const,
        schedule: '0 2 * * *', // Daily at 2 AM
        rules: ['include:*.csv', 'include:*.json', 'compress:true']
      },
      {
        name: 'IZA OS User Data',
        source: 'iza-os-user-db',
        destination: 'iza-os-user-backup',
        type: 'database' as const,
        schedule: '0 1 * * *', // Daily at 1 AM
        rules: ['include:user_data', 'exclude:passwords', 'encrypt:true']
      },
      {
        name: 'IZA OS System Logs',
        source: 'iza-os-logs',
        destination: 'iza-os-logs-archive',
        type: 'directory' as const,
        schedule: '0 0 * * 0', // Weekly on Sunday
        rules: ['include:*.log', 'compress:true', 'archive:true']
      }
    ]

    const createdJobs: SyncJob[] = []
    
    for (const jobConfig of izaJobs) {
      try {
        const job = await this.createSyncJob(jobConfig)
        createdJobs.push(job)
      } catch (error) {
        console.error(`Error creating sync job ${jobConfig.name}:`, error)
      }
    }

    return createdJobs
  }

  // IZA OS Specific Sync Rules
  async createIZAOSSyncRules(): Promise<SyncRule[]> {
    const izaRules = [
      {
        name: 'Include Configuration Files',
        pattern: '*.json,*.yaml,*.yml,*.toml',
        action: 'include' as const,
        priority: 1,
        description: 'Include all configuration files in sync operations'
      },
      {
        name: 'Exclude Temporary Files',
        pattern: '*.tmp,*.temp,*.cache,*.log',
        action: 'exclude' as const,
        priority: 2,
        description: 'Exclude temporary and cache files from sync'
      },
      {
        name: 'Compress Large Files',
        pattern: '*.csv,*.json,*.xml',
        action: 'transform' as const,
        priority: 3,
        description: 'Compress large data files during sync'
      },
      {
        name: 'Encrypt Sensitive Data',
        pattern: '*password*,*secret*,*key*',
        action: 'transform' as const,
        priority: 4,
        description: 'Encrypt sensitive data files during sync'
      },
      {
        name: 'Include Learning Data',
        pattern: '*learning*,*training*,*model*',
        action: 'include' as const,
        priority: 5,
        description: 'Include all machine learning related files'
      }
    ]

    const createdRules: SyncRule[] = []
    
    for (const ruleConfig of izaRules) {
      try {
        const rule = await this.createSyncRule(ruleConfig)
        createdRules.push(rule)
      } catch (error) {
        console.error(`Error creating sync rule ${ruleConfig.name}:`, error)
      }
    }

    return createdRules
  }

  // System Statistics
  async getSystemStatistics(): Promise<{
    totalJobs: number
    activeJobs: number
    totalFiles: number
    syncedFiles: number
    pendingFiles: number
    errorFiles: number
    totalConflicts: number
    resolvedConflicts: number
    averageSyncTime: number
    totalDataTransferred: number
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return {
        totalJobs: data.total_jobs || 0,
        activeJobs: data.active_jobs || 0,
        totalFiles: data.total_files || 0,
        syncedFiles: data.synced_files || 0,
        pendingFiles: data.pending_files || 0,
        errorFiles: data.error_files || 0,
        totalConflicts: data.total_conflicts || 0,
        resolvedConflicts: data.resolved_conflicts || 0,
        averageSyncTime: data.average_sync_time || 0,
        totalDataTransferred: data.total_data_transferred || 0
      }
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      const jobs = Array.from(this.syncJobs.values())
      const files = Array.from(this.fileMetadata.values())
      const conflicts = Array.from(this.syncConflicts.values())

      return {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active').length,
        totalFiles: files.length,
        syncedFiles: files.filter(f => f.syncStatus === 'synced').length,
        pendingFiles: files.filter(f => f.syncStatus === 'pending').length,
        errorFiles: files.filter(f => f.syncStatus === 'error').length,
        totalConflicts: conflicts.length,
        resolvedConflicts: conflicts.filter(c => c.resolvedAt).length,
        averageSyncTime: jobs.reduce((sum, j) => sum + j.syncTime, 0) / jobs.length || 0,
        totalDataTransferred: files.reduce((sum, f) => sum + f.size, 0)
      }
    }
  }

  // System Overview
  async getSystemOverview(): Promise<{
    health: boolean
    totalJobs: number
    activeJobs: number
    totalFiles: number
    syncedFiles: number
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
        totalJobs: statistics.totalJobs,
        activeJobs: statistics.activeJobs,
        totalFiles: statistics.totalFiles,
        syncedFiles: statistics.syncedFiles,
        systemResources: {
          cpuUsage: 15, // Mock data
          memoryUsage: 30,
          diskUsage: 45
        }
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        totalJobs: 0,
        activeJobs: 0,
        totalFiles: 0,
        syncedFiles: 0,
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

    return headers
  }
}

// Export singleton instance
export const fileSyncService = new FileSyncService()
export default fileSyncService
