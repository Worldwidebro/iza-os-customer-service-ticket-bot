// NocoDB Integration for IZA OS
// No-code database for structured data and knowledge base in "Optimize Through Learning" system

interface NocoDBConfig {
  baseUrl: string
  apiKey?: string
  projectId: string
  baseId: string
  maxConnections: number
  cacheEnabled: boolean
}

interface DatabaseTable {
  id: string
  name: string
  title: string
  description: string
  type: 'table' | 'view' | 'function'
  columns: DatabaseColumn[]
  rowCount: number
  lastModified: string
  permissions: {
    read: boolean
    write: boolean
    delete: boolean
    admin: boolean
  }
}

interface DatabaseColumn {
  id: string
  name: string
  title: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'json' | 'attachment' | 'link'
  required: boolean
  unique: boolean
  defaultValue?: any
  description?: string
}

interface DatabaseRecord {
  id: string
  data: Record<string, any>
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

interface DatabaseQuery {
  id: string
  name: string
  sql: string
  parameters?: any[]
  description: string
  lastExecuted: string
  executionCount: number
  averageExecutionTime: number
}

interface DatabaseBackup {
  id: string
  name: string
  description: string
  size: number
  createdAt: string
  status: 'completed' | 'in_progress' | 'failed'
  downloadUrl?: string
}

class NocoDBService {
  private config: NocoDBConfig
  private tables: Map<string, DatabaseTable> = new Map()
  private queries: Map<string, DatabaseQuery> = new Map()
  private backups: Map<string, DatabaseBackup> = new Map()

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:8011', // NocoDB API server
      projectId: 'iza-os-project',
      baseId: 'iza-os-base',
      maxConnections: 50,
      cacheEnabled: true
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

  // Table Management
  async createTable(config: {
    name: string
    title: string
    description?: string
    columns: Array<{
      name: string
      title: string
      type: 'text' | 'number' | 'date' | 'boolean' | 'json' | 'attachment' | 'link'
      required?: boolean
      unique?: boolean
      defaultValue?: any
      description?: string
    }>
  }): Promise<DatabaseTable> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tables`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          title: config.title,
          description: config.description || '',
          columns: config.columns.map(col => ({
            name: col.name,
            title: col.title,
            type: col.type,
            required: col.required || false,
            unique: col.unique || false,
            default_value: col.defaultValue,
            description: col.description || ''
          }))
        })
      })

      const data = await response.json()
      const table: DatabaseTable = {
        id: data.id,
        name: config.name,
        title: config.title,
        description: config.description || '',
        type: 'table',
        columns: data.columns || [],
        rowCount: 0,
        lastModified: new Date().toISOString(),
        permissions: {
          read: true,
          write: true,
          delete: true,
          admin: true
        }
      }

      this.tables.set(table.id, table)
      return table
    } catch (error) {
      console.error('Error creating table:', error)
      throw error
    }
  }

  async getTables(): Promise<DatabaseTable[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tables`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.tables || []
    } catch (error) {
      console.error('Error fetching tables:', error)
      return Array.from(this.tables.values())
    }
  }

  async getTable(tableId: string): Promise<DatabaseTable | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tables/${tableId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        return data.table
      }
      return null
    } catch (error) {
      console.error(`Error fetching table ${tableId}:`, error)
      return null
    }
  }

  async updateTable(tableId: string, updates: Partial<DatabaseTable>): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tables/${tableId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const table = this.tables.get(tableId)
        if (table) {
          Object.assign(table, updates)
          table.lastModified = new Date().toISOString()
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error updating table ${tableId}:`, error)
      return false
    }
  }

  async deleteTable(tableId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tables/${tableId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (response.ok) {
        this.tables.delete(tableId)
        return true
      }
      return false
    } catch (error) {
      console.error(`Error deleting table ${tableId}:`, error)
      return false
    }
  }

  // Record Management
  async createRecord(tableId: string, data: Record<string, any>): Promise<DatabaseRecord> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tables/${tableId}/records`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ data })
      })

      const responseData = await response.json()
      const record: DatabaseRecord = {
        id: responseData.id,
        data: responseData.data,
        createdAt: responseData.created_at,
        updatedAt: responseData.updated_at,
        createdBy: responseData.created_by,
        updatedBy: responseData.updated_by
      }

      return record
    } catch (error) {
      console.error(`Error creating record in table ${tableId}:`, error)
      throw error
    }
  }

  async getRecords(tableId: string, options?: {
    limit?: number
    offset?: number
    where?: any
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
  }): Promise<DatabaseRecord[]> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())
      if (options?.where) params.append('where', JSON.stringify(options.where))
      if (options?.orderBy) params.append('orderBy', options.orderBy)
      if (options?.orderDirection) params.append('orderDirection', options.orderDirection)

      const response = await fetch(`${this.config.baseUrl}/api/v1/tables/${tableId}/records?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.records || []
    } catch (error) {
      console.error(`Error fetching records from table ${tableId}:`, error)
      return []
    }
  }

  async updateRecord(tableId: string, recordId: string, data: Record<string, any>): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tables/${tableId}/records/${recordId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ data })
      })

      return response.ok
    } catch (error) {
      console.error(`Error updating record ${recordId} in table ${tableId}:`, error)
      return false
    }
  }

  async deleteRecord(tableId: string, recordId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tables/${tableId}/records/${recordId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return response.ok
    } catch (error) {
      console.error(`Error deleting record ${recordId} from table ${tableId}:`, error)
      return false
    }
  }

  // Query Management
  async createQuery(config: {
    name: string
    sql: string
    parameters?: any[]
    description?: string
  }): Promise<DatabaseQuery> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/queries`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          sql: config.sql,
          parameters: config.parameters || [],
          description: config.description || ''
        })
      })

      const data = await response.json()
      const query: DatabaseQuery = {
        id: data.id,
        name: config.name,
        sql: config.sql,
        parameters: config.parameters || [],
        description: config.description || '',
        lastExecuted: new Date().toISOString(),
        executionCount: 0,
        averageExecutionTime: 0
      }

      this.queries.set(query.id, query)
      return query
    } catch (error) {
      console.error('Error creating query:', error)
      throw error
    }
  }

  async executeQuery(queryId: string, parameters?: any[]): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/queries/${queryId}/execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          parameters: parameters || []
        })
      })

      const data = await response.json()
      
      // Update query statistics
      const query = this.queries.get(queryId)
      if (query) {
        query.lastExecuted = new Date().toISOString()
        query.executionCount += 1
        query.averageExecutionTime = (query.averageExecutionTime * (query.executionCount - 1) + data.execution_time) / query.executionCount
      }

      return data.results || []
    } catch (error) {
      console.error(`Error executing query ${queryId}:`, error)
      return []
    }
  }

  // Backup Management
  async createBackup(config: {
    name: string
    description?: string
    includeData?: boolean
  }): Promise<DatabaseBackup> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/backups`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          description: config.description || '',
          include_data: config.includeData !== false
        })
      })

      const data = await response.json()
      const backup: DatabaseBackup = {
        id: data.id,
        name: config.name,
        description: config.description || '',
        size: data.size || 0,
        createdAt: new Date().toISOString(),
        status: 'in_progress'
      }

      this.backups.set(backup.id, backup)
      return backup
    } catch (error) {
      console.error('Error creating backup:', error)
      throw error
    }
  }

  async getBackups(): Promise<DatabaseBackup[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/backups`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.backups || []
    } catch (error) {
      console.error('Error fetching backups:', error)
      return Array.from(this.backups.values())
    }
  }

  // IZA OS Specific Tables
  async createIZAOSTables(): Promise<DatabaseTable[]> {
    const izaTables = [
      {
        name: 'iza_os_agents',
        title: 'IZA OS Agents',
        description: 'Stores information about all IZA OS agents',
        columns: [
          { name: 'agent_id', title: 'Agent ID', type: 'text', required: true, unique: true },
          { name: 'agent_type', title: 'Agent Type', type: 'text', required: true },
          { name: 'name', title: 'Name', type: 'text', required: true },
          { name: 'status', title: 'Status', type: 'text', required: true },
          { name: 'performance_score', title: 'Performance Score', type: 'number' },
          { name: 'last_active', title: 'Last Active', type: 'date' },
          { name: 'configuration', title: 'Configuration', type: 'json' }
        ]
      },
      {
        name: 'iza_os_business_metrics',
        title: 'IZA OS Business Metrics',
        description: 'Stores business performance metrics',
        columns: [
          { name: 'metric_id', title: 'Metric ID', type: 'text', required: true, unique: true },
          { name: 'metric_name', title: 'Metric Name', type: 'text', required: true },
          { name: 'value', title: 'Value', type: 'number', required: true },
          { name: 'unit', title: 'Unit', type: 'text' },
          { name: 'timestamp', title: 'Timestamp', type: 'date', required: true },
          { name: 'category', title: 'Category', type: 'text' }
        ]
      },
      {
        name: 'iza_os_user_interactions',
        title: 'IZA OS User Interactions',
        description: 'Stores user interaction data',
        columns: [
          { name: 'interaction_id', title: 'Interaction ID', type: 'text', required: true, unique: true },
          { name: 'user_id', title: 'User ID', type: 'text', required: true },
          { name: 'action', title: 'Action', type: 'text', required: true },
          { name: 'page', title: 'Page', type: 'text' },
          { name: 'timestamp', title: 'Timestamp', type: 'date', required: true },
          { name: 'session_id', title: 'Session ID', type: 'text' },
          { name: 'metadata', title: 'Metadata', type: 'json' }
        ]
      },
      {
        name: 'iza_os_learning_data',
        title: 'IZA OS Learning Data',
        description: 'Stores machine learning training data',
        columns: [
          { name: 'data_id', title: 'Data ID', type: 'text', required: true, unique: true },
          { name: 'dataset_name', title: 'Dataset Name', type: 'text', required: true },
          { name: 'data_type', title: 'Data Type', type: 'text', required: true },
          { name: 'features', title: 'Features', type: 'json', required: true },
          { name: 'labels', title: 'Labels', type: 'json' },
          { name: 'created_at', title: 'Created At', type: 'date', required: true },
          { name: 'quality_score', title: 'Quality Score', type: 'number' }
        ]
      },
      {
        name: 'iza_os_optimization_results',
        title: 'IZA OS Optimization Results',
        description: 'Stores optimization algorithm results',
        columns: [
          { name: 'result_id', title: 'Result ID', type: 'text', required: true, unique: true },
          { name: 'optimization_type', title: 'Optimization Type', type: 'text', required: true },
          { name: 'objective', title: 'Objective', type: 'text', required: true },
          { name: 'best_solution', title: 'Best Solution', type: 'json', required: true },
          { name: 'best_score', title: 'Best Score', type: 'number', required: true },
          { name: 'iterations', title: 'Iterations', type: 'number' },
          { name: 'execution_time', title: 'Execution Time', type: 'number' },
          { name: 'created_at', title: 'Created At', type: 'date', required: true }
        ]
      }
    ]

    const createdTables: DatabaseTable[] = []
    
    for (const tableConfig of izaTables) {
      try {
        const table = await this.createTable(tableConfig)
        createdTables.push(table)
      } catch (error) {
        console.error(`Error creating table ${tableConfig.name}:`, error)
      }
    }

    return createdTables
  }

  // IZA OS Specific Queries
  async createIZAOSQueries(): Promise<DatabaseQuery[]> {
    const izaQueries = [
      {
        name: 'Get Top Performing Agents',
        sql: 'SELECT agent_id, name, performance_score FROM iza_os_agents WHERE status = "active" ORDER BY performance_score DESC LIMIT 10',
        description: 'Retrieves the top 10 performing active agents'
      },
      {
        name: 'Get Business Metrics Trend',
        sql: 'SELECT metric_name, value, timestamp FROM iza_os_business_metrics WHERE timestamp >= ? ORDER BY timestamp DESC',
        description: 'Retrieves business metrics trend for the last period'
      },
      {
        name: 'Get User Activity Summary',
        sql: 'SELECT user_id, COUNT(*) as activity_count, MAX(timestamp) as last_activity FROM iza_os_user_interactions GROUP BY user_id ORDER BY activity_count DESC',
        description: 'Summarizes user activity across the platform'
      },
      {
        name: 'Get Learning Data Quality',
        sql: 'SELECT dataset_name, AVG(quality_score) as avg_quality, COUNT(*) as record_count FROM iza_os_learning_data GROUP BY dataset_name ORDER BY avg_quality DESC',
        description: 'Analyzes the quality of learning datasets'
      },
      {
        name: 'Get Optimization Performance',
        sql: 'SELECT optimization_type, AVG(best_score) as avg_score, AVG(execution_time) as avg_time FROM iza_os_optimization_results GROUP BY optimization_type ORDER BY avg_score DESC',
        description: 'Analyzes optimization algorithm performance'
      }
    ]

    const createdQueries: DatabaseQuery[] = []
    
    for (const queryConfig of izaQueries) {
      try {
        const query = await this.createQuery(queryConfig)
        createdQueries.push(query)
      } catch (error) {
        console.error(`Error creating query ${queryConfig.name}:`, error)
      }
    }

    return createdQueries
  }

  // System Statistics
  async getSystemStatistics(): Promise<{
    totalTables: number
    totalRecords: number
    totalQueries: number
    totalBackups: number
    averageQueryTime: number
    databaseSize: number
    lastBackup: string
    activeConnections: number
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return {
        totalTables: data.total_tables || 0,
        totalRecords: data.total_records || 0,
        totalQueries: data.total_queries || 0,
        totalBackups: data.total_backups || 0,
        averageQueryTime: data.average_query_time || 0,
        databaseSize: data.database_size || 0,
        lastBackup: data.last_backup || '',
        activeConnections: data.active_connections || 0
      }
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      const tables = Array.from(this.tables.values())
      const queries = Array.from(this.queries.values())
      const backups = Array.from(this.backups.values())

      return {
        totalTables: tables.length,
        totalRecords: tables.reduce((sum, t) => sum + t.rowCount, 0),
        totalQueries: queries.length,
        totalBackups: backups.length,
        averageQueryTime: queries.reduce((sum, q) => sum + q.averageExecutionTime, 0) / queries.length || 0,
        databaseSize: 0,
        lastBackup: backups.length > 0 ? backups[0].createdAt : '',
        activeConnections: 0
      }
    }
  }

  // System Overview
  async getSystemOverview(): Promise<{
    health: boolean
    totalTables: number
    totalRecords: number
    totalQueries: number
    averageQueryTime: number
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
        totalTables: statistics.totalTables,
        totalRecords: statistics.totalRecords,
        totalQueries: statistics.totalQueries,
        averageQueryTime: statistics.averageQueryTime,
        systemResources: {
          cpuUsage: 20, // Mock data
          memoryUsage: 35,
          diskUsage: 25
        }
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        totalTables: 0,
        totalRecords: 0,
        totalQueries: 0,
        averageQueryTime: 0,
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
export const nocoDBService = new NocoDBService()
export default nocoDBService
