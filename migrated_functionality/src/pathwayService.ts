// Pathway Integration for IZA OS
// Real-time data processing engine for "Optimize Through Learning" system

interface PathwayConfig {
  baseUrl: string
  apiKey?: string
  maxConnections: number
  bufferSize: number
  processingMode: 'streaming' | 'batch' | 'hybrid'
}

interface DataStream {
  id: string
  name: string
  source: string
  type: 'file' | 'database' | 'api' | 'kafka' | 'websocket'
  status: 'active' | 'paused' | 'error' | 'stopped'
  throughput: number
  latency: number
  lastProcessed: string
  totalRecords: number
  errorRate: number
}

interface ProcessingJob {
  id: string
  name: string
  type: 'transformation' | 'aggregation' | 'filtering' | 'enrichment'
  status: 'running' | 'completed' | 'failed' | 'paused'
  inputStreams: string[]
  outputStreams: string[]
  startedAt: string
  completedAt?: string
  recordsProcessed: number
  processingTime: number
  errorCount: number
}

interface DataTransformation {
  id: string
  name: string
  description: string
  inputSchema: any
  outputSchema: any
  transformationLogic: string
  performance: {
    avgProcessingTime: number
    throughput: number
    errorRate: number
    lastOptimized: string
  }
}

class PathwayService {
  private config: PathwayConfig
  private dataStreams: Map<string, DataStream> = new Map()
  private processingJobs: Map<string, ProcessingJob> = new Map()
  private transformations: Map<string, DataTransformation> = new Map()

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:8009', // Pathway API server
      maxConnections: 100,
      bufferSize: 10000,
      processingMode: 'streaming'
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

  // Data Stream Management
  async createDataStream(config: {
    name: string
    source: string
    type: 'file' | 'database' | 'api' | 'kafka' | 'websocket'
    schema?: any
  }): Promise<DataStream> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/streams`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          source: config.source,
          type: config.type,
          schema: config.schema || {}
        })
      })

      const data = await response.json()
      const stream: DataStream = {
        id: data.id,
        name: config.name,
        source: config.source,
        type: config.type,
        status: 'active',
        throughput: 0,
        latency: 0,
        lastProcessed: new Date().toISOString(),
        totalRecords: 0,
        errorRate: 0
      }

      this.dataStreams.set(stream.id, stream)
      return stream
    } catch (error) {
      console.error('Error creating data stream:', error)
      throw error
    }
  }

  async getDataStreams(): Promise<DataStream[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/streams`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.streams || []
    } catch (error) {
      console.error('Error fetching data streams:', error)
      return Array.from(this.dataStreams.values())
    }
  }

  async startDataStream(streamId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/streams/${streamId}/start`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const stream = this.dataStreams.get(streamId)
        if (stream) {
          stream.status = 'active'
          stream.lastProcessed = new Date().toISOString()
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error starting data stream ${streamId}:`, error)
      return false
    }
  }

  async stopDataStream(streamId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/streams/${streamId}/stop`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const stream = this.dataStreams.get(streamId)
        if (stream) {
          stream.status = 'stopped'
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error stopping data stream ${streamId}:`, error)
      return false
    }
  }

  // Processing Job Management
  async createProcessingJob(config: {
    name: string
    type: 'transformation' | 'aggregation' | 'filtering' | 'enrichment'
    inputStreams: string[]
    outputStreams: string[]
    transformationLogic?: string
  }): Promise<ProcessingJob> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          type: config.type,
          input_streams: config.inputStreams,
          output_streams: config.outputStreams,
          transformation_logic: config.transformationLogic || ''
        })
      })

      const data = await response.json()
      const job: ProcessingJob = {
        id: data.id,
        name: config.name,
        type: config.type,
        status: 'running',
        inputStreams: config.inputStreams,
        outputStreams: config.outputStreams,
        startedAt: new Date().toISOString(),
        recordsProcessed: 0,
        processingTime: 0,
        errorCount: 0
      }

      this.processingJobs.set(job.id, job)
      return job
    } catch (error) {
      console.error('Error creating processing job:', error)
      throw error
    }
  }

  async getProcessingJobs(): Promise<ProcessingJob[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/jobs`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.jobs || []
    } catch (error) {
      console.error('Error fetching processing jobs:', error)
      return Array.from(this.processingJobs.values())
    }
  }

  async executeJob(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/jobs/${jobId}/execute`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const job = this.processingJobs.get(jobId)
        if (job) {
          job.status = 'running'
          job.startedAt = new Date().toISOString()
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error executing job ${jobId}:`, error)
      return false
    }
  }

  // Data Transformation Management
  async createTransformation(config: {
    name: string
    description: string
    inputSchema: any
    outputSchema: any
    transformationLogic: string
  }): Promise<DataTransformation> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/transformations`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          input_schema: config.inputSchema,
          output_schema: config.outputSchema,
          transformation_logic: config.transformationLogic
        })
      })

      const data = await response.json()
      const transformation: DataTransformation = {
        id: data.id,
        name: config.name,
        description: config.description,
        inputSchema: config.inputSchema,
        outputSchema: config.outputSchema,
        transformationLogic: config.transformationLogic,
        performance: {
          avgProcessingTime: 0,
          throughput: 0,
          errorRate: 0,
          lastOptimized: new Date().toISOString()
        }
      }

      this.transformations.set(transformation.id, transformation)
      return transformation
    } catch (error) {
      console.error('Error creating transformation:', error)
      throw error
    }
  }

  async getTransformations(): Promise<DataTransformation[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/transformations`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.transformations || []
    } catch (error) {
      console.error('Error fetching transformations:', error)
      return Array.from(this.transformations.values())
    }
  }

  // IZA OS Specific Data Streams
  async createIZAOSDataStreams(): Promise<DataStream[]> {
    const izaStreams = [
      {
        name: 'IZA OS Business Metrics',
        source: 'iza-os-metrics-api',
        type: 'api' as const,
        schema: {
          timestamp: 'datetime',
          ecosystem_value: 'float',
          revenue_pipeline: 'float',
          agent_count: 'integer',
          automation_level: 'float',
          team_efficiency: 'float'
        }
      },
      {
        name: 'IZA OS Agent Performance',
        source: 'iza-os-agents-api',
        type: 'api' as const,
        schema: {
          agent_id: 'string',
          agent_type: 'string',
          performance_score: 'float',
          execution_time: 'float',
          success_rate: 'float',
          timestamp: 'datetime'
        }
      },
      {
        name: 'IZA OS User Interactions',
        source: 'iza-os-frontend',
        type: 'websocket' as const,
        schema: {
          user_id: 'string',
          action: 'string',
          timestamp: 'datetime',
          session_id: 'string',
          page: 'string'
        }
      },
      {
        name: 'IZA OS System Logs',
        source: 'iza-os-logs',
        type: 'file' as const,
        schema: {
          level: 'string',
          message: 'string',
          service: 'string',
          timestamp: 'datetime',
          trace_id: 'string'
        }
      },
      {
        name: 'IZA OS Financial Data',
        source: 'iza-os-financial-db',
        type: 'database' as const,
        schema: {
          transaction_id: 'string',
          amount: 'float',
          currency: 'string',
          type: 'string',
          timestamp: 'datetime',
          account_id: 'string'
        }
      }
    ]

    const createdStreams: DataStream[] = []
    
    for (const streamConfig of izaStreams) {
      try {
        const stream = await this.createDataStream(streamConfig)
        createdStreams.push(stream)
      } catch (error) {
        console.error(`Error creating ${streamConfig.name}:`, error)
      }
    }

    return createdStreams
  }

  // IZA OS Specific Processing Jobs
  async createIZAOSProcessingJobs(): Promise<ProcessingJob[]> {
    const izaJobs = [
      {
        name: 'IZA OS Real-time Analytics',
        type: 'aggregation' as const,
        inputStreams: ['IZA OS Business Metrics', 'IZA OS Agent Performance'],
        outputStreams: ['IZA OS Analytics Output'],
        transformationLogic: 'Aggregate metrics and performance data for real-time dashboard updates'
      },
      {
        name: 'IZA OS User Behavior Analysis',
        type: 'transformation' as const,
        inputStreams: ['IZA OS User Interactions'],
        outputStreams: ['IZA OS User Insights'],
        transformationLogic: 'Analyze user behavior patterns and generate insights'
      },
      {
        name: 'IZA OS System Health Monitoring',
        type: 'filtering' as const,
        inputStreams: ['IZA OS System Logs'],
        outputStreams: ['IZA OS Health Alerts'],
        transformationLogic: 'Filter and process system logs for health monitoring'
      },
      {
        name: 'IZA OS Financial Reporting',
        type: 'aggregation' as const,
        inputStreams: ['IZA OS Financial Data'],
        outputStreams: ['IZA OS Financial Reports'],
        transformationLogic: 'Aggregate financial data for reporting and analysis'
      }
    ]

    const createdJobs: ProcessingJob[] = []
    
    for (const jobConfig of izaJobs) {
      try {
        const job = await this.createProcessingJob(jobConfig)
        createdJobs.push(job)
      } catch (error) {
        console.error(`Error creating ${jobConfig.name}:`, error)
      }
    }

    return createdJobs
  }

  // System Statistics
  async getSystemStatistics(): Promise<{
    totalStreams: number
    activeStreams: number
    totalJobs: number
    runningJobs: number
    totalTransformations: number
    totalRecordsProcessed: number
    averageThroughput: number
    averageLatency: number
    errorRate: number
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return {
        totalStreams: data.total_streams || 0,
        activeStreams: data.active_streams || 0,
        totalJobs: data.total_jobs || 0,
        runningJobs: data.running_jobs || 0,
        totalTransformations: data.total_transformations || 0,
        totalRecordsProcessed: data.total_records_processed || 0,
        averageThroughput: data.average_throughput || 0,
        averageLatency: data.average_latency || 0,
        errorRate: data.error_rate || 0
      }
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      const streams = Array.from(this.dataStreams.values())
      const jobs = Array.from(this.processingJobs.values())
      const transformations = Array.from(this.transformations.values())

      return {
        totalStreams: streams.length,
        activeStreams: streams.filter(s => s.status === 'active').length,
        totalJobs: jobs.length,
        runningJobs: jobs.filter(j => j.status === 'running').length,
        totalTransformations: transformations.length,
        totalRecordsProcessed: streams.reduce((sum, s) => sum + s.totalRecords, 0),
        averageThroughput: streams.reduce((sum, s) => sum + s.throughput, 0) / streams.length || 0,
        averageLatency: streams.reduce((sum, s) => sum + s.latency, 0) / streams.length || 0,
        errorRate: streams.reduce((sum, s) => sum + s.errorRate, 0) / streams.length || 0
      }
    }
  }

  // System Overview
  async getSystemOverview(): Promise<{
    health: boolean
    totalStreams: number
    activeJobs: number
    totalRecordsProcessed: number
    averageThroughput: number
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
        totalStreams: statistics.totalStreams,
        activeJobs: statistics.runningJobs,
        totalRecordsProcessed: statistics.totalRecordsProcessed,
        averageThroughput: statistics.averageThroughput,
        systemResources: {
          cpuUsage: 25, // Mock data
          memoryUsage: 40,
          diskUsage: 15
        }
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        totalStreams: 0,
        activeJobs: 0,
        totalRecordsProcessed: 0,
        averageThroughput: 0,
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
export const pathwayService = new PathwayService()
export default pathwayService
