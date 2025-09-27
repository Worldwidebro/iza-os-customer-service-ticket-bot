// BitNet Integration for IZA OS
// Core AI for learning and optimization in "Optimize Through Learning" system

interface BitNetConfig {
  baseUrl: string
  apiKey?: string
  modelVersion: string
  maxTokens: number
  temperature: number
  learningRate: number
  batchSize: number
}

interface LearningTask {
  id: string
  name: string
  type: 'classification' | 'regression' | 'clustering' | 'optimization' | 'reinforcement'
  status: 'training' | 'completed' | 'failed' | 'paused'
  dataset: string
  model: string
  startedAt: string
  completedAt?: string
  epochs: number
  currentEpoch: number
  accuracy: number
  loss: number
  learningRate: number
  progress: number
}

interface OptimizationResult {
  id: string
  taskId: string
  objective: string
  bestSolution: any
  bestScore: number
  iterations: number
  convergenceRate: number
  executionTime: number
  parameters: {
    learningRate: number
    batchSize: number
    epochs: number
    optimizer: string
  }
}

interface ModelPerformance {
  modelId: string
  taskType: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  trainingTime: number
  inferenceTime: number
  memoryUsage: number
  lastUpdated: string
}

interface LearningInsight {
  id: string
  type: 'pattern' | 'anomaly' | 'trend' | 'optimization'
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
  data: any
  timestamp: string
}

class BitNetService {
  private config: BitNetConfig
  private learningTasks: Map<string, LearningTask> = new Map()
  private optimizationResults: Map<string, OptimizationResult> = new Map()
  private modelPerformance: Map<string, ModelPerformance> = new Map()
  private learningInsights: Map<string, LearningInsight> = new Map()

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:8010', // BitNet API server
      modelVersion: 'bitnet-1.0',
      maxTokens: 4096,
      temperature: 0.7,
      learningRate: 0.001,
      batchSize: 32
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

  // Learning Task Management
  async createLearningTask(config: {
    name: string
    type: 'classification' | 'regression' | 'clustering' | 'optimization' | 'reinforcement'
    dataset: string
    model: string
    epochs?: number
    learningRate?: number
  }): Promise<LearningTask> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/learning-tasks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          type: config.type,
          dataset: config.dataset,
          model: config.model,
          epochs: config.epochs || 100,
          learning_rate: config.learningRate || this.config.learningRate
        })
      })

      const data = await response.json()
      const task: LearningTask = {
        id: data.id,
        name: config.name,
        type: config.type,
        status: 'training',
        dataset: config.dataset,
        model: config.model,
        startedAt: new Date().toISOString(),
        epochs: config.epochs || 100,
        currentEpoch: 0,
        accuracy: 0,
        loss: 1.0,
        learningRate: config.learningRate || this.config.learningRate,
        progress: 0
      }

      this.learningTasks.set(task.id, task)
      return task
    } catch (error) {
      console.error('Error creating learning task:', error)
      throw error
    }
  }

  async getLearningTasks(): Promise<LearningTask[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/learning-tasks`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.tasks || []
    } catch (error) {
      console.error('Error fetching learning tasks:', error)
      return Array.from(this.learningTasks.values())
    }
  }

  async startLearningTask(taskId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/learning-tasks/${taskId}/start`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const task = this.learningTasks.get(taskId)
        if (task) {
          task.status = 'training'
          task.startedAt = new Date().toISOString()
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error starting learning task ${taskId}:`, error)
      return false
    }
  }

  async pauseLearningTask(taskId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/learning-tasks/${taskId}/pause`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const task = this.learningTasks.get(taskId)
        if (task) {
          task.status = 'paused'
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Error pausing learning task ${taskId}:`, error)
      return false
    }
  }

  // Optimization Management
  async runOptimization(config: {
    objective: string
    parameters: any
    constraints?: any
    algorithm?: string
    maxIterations?: number
  }): Promise<OptimizationResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/optimization`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          objective: config.objective,
          parameters: config.parameters,
          constraints: config.constraints || {},
          algorithm: config.algorithm || 'genetic',
          max_iterations: config.maxIterations || 1000
        })
      })

      const data = await response.json()
      const result: OptimizationResult = {
        id: data.id,
        taskId: data.task_id,
        objective: config.objective,
        bestSolution: data.best_solution,
        bestScore: data.best_score,
        iterations: data.iterations,
        convergenceRate: data.convergence_rate,
        executionTime: data.execution_time,
        parameters: {
          learningRate: data.parameters.learning_rate,
          batchSize: data.parameters.batch_size,
          epochs: data.parameters.epochs,
          optimizer: data.parameters.optimizer
        }
      }

      this.optimizationResults.set(result.id, result)
      return result
    } catch (error) {
      console.error('Error running optimization:', error)
      throw error
    }
  }

  async getOptimizationResults(): Promise<OptimizationResult[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/optimization`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Error fetching optimization results:', error)
      return Array.from(this.optimizationResults.values())
    }
  }

  // Model Performance Management
  async evaluateModel(modelId: string, testData: any): Promise<ModelPerformance> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/models/${modelId}/evaluate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          test_data: testData
        })
      })

      const data = await response.json()
      const performance: ModelPerformance = {
        modelId: modelId,
        taskType: data.task_type,
        accuracy: data.accuracy,
        precision: data.precision,
        recall: data.recall,
        f1Score: data.f1_score,
        trainingTime: data.training_time,
        inferenceTime: data.inference_time,
        memoryUsage: data.memory_usage,
        lastUpdated: new Date().toISOString()
      }

      this.modelPerformance.set(modelId, performance)
      return performance
    } catch (error) {
      console.error(`Error evaluating model ${modelId}:`, error)
      throw error
    }
  }

  async getModelPerformance(): Promise<ModelPerformance[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/models/performance`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.performance || []
    } catch (error) {
      console.error('Error fetching model performance:', error)
      return Array.from(this.modelPerformance.values())
    }
  }

  // Learning Insights
  async generateInsights(data: any): Promise<LearningInsight[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/insights`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          data: data
        })
      })

      const responseData = await response.json()
      const insights: LearningInsight[] = responseData.insights.map((insight: any) => ({
        id: insight.id,
        type: insight.type,
        description: insight.description,
        confidence: insight.confidence,
        impact: insight.impact,
        recommendations: insight.recommendations,
        data: insight.data,
        timestamp: new Date().toISOString()
      }))

      insights.forEach(insight => {
        this.learningInsights.set(insight.id, insight)
      })

      return insights
    } catch (error) {
      console.error('Error generating insights:', error)
      return []
    }
  }

  async getLearningInsights(): Promise<LearningInsight[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/insights`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.insights || []
    } catch (error) {
      console.error('Error fetching learning insights:', error)
      return Array.from(this.learningInsights.values())
    }
  }

  // IZA OS Specific Learning Tasks
  async createIZAOSLearningTasks(): Promise<LearningTask[]> {
    const izaTasks = [
      {
        name: 'IZA OS Business Performance Prediction',
        type: 'regression' as const,
        dataset: 'iza-os-business-metrics',
        model: 'bitnet-regression-v1',
        epochs: 200,
        learningRate: 0.001
      },
      {
        name: 'IZA OS Agent Classification',
        type: 'classification' as const,
        dataset: 'iza-os-agent-data',
        model: 'bitnet-classification-v1',
        epochs: 150,
        learningRate: 0.0005
      },
      {
        name: 'IZA OS User Behavior Clustering',
        type: 'clustering' as const,
        dataset: 'iza-os-user-interactions',
        model: 'bitnet-clustering-v1',
        epochs: 100,
        learningRate: 0.01
      },
      {
        name: 'IZA OS Resource Optimization',
        type: 'optimization' as const,
        dataset: 'iza-os-resource-usage',
        model: 'bitnet-optimization-v1',
        epochs: 300,
        learningRate: 0.002
      },
      {
        name: 'IZA OS Autonomous Decision Making',
        type: 'reinforcement' as const,
        dataset: 'iza-os-decision-history',
        model: 'bitnet-rl-v1',
        epochs: 500,
        learningRate: 0.0001
      }
    ]

    const createdTasks: LearningTask[] = []
    
    for (const taskConfig of izaTasks) {
      try {
        const task = await this.createLearningTask(taskConfig)
        createdTasks.push(task)
      } catch (error) {
        console.error(`Error creating ${taskConfig.name}:`, error)
      }
    }

    return createdTasks
  }

  // IZA OS Specific Optimizations
  async runIZAOSOptimizations(): Promise<OptimizationResult[]> {
    const izaOptimizations = [
      {
        objective: 'Maximize IZA OS ecosystem value',
        parameters: {
          agent_count: { min: 1000, max: 2000 },
          automation_level: { min: 0.8, max: 1.0 },
          team_efficiency: { min: 0.9, max: 1.0 }
        },
        algorithm: 'genetic',
        maxIterations: 2000
      },
      {
        objective: 'Minimize IZA OS operational costs',
        parameters: {
          compute_resources: { min: 0.5, max: 2.0 },
          storage_costs: { min: 0.1, max: 1.0 },
          network_bandwidth: { min: 0.3, max: 1.5 }
        },
        algorithm: 'particle_swarm',
        maxIterations: 1500
      },
      {
        objective: 'Optimize IZA OS agent performance',
        parameters: {
          response_time: { min: 0.1, max: 2.0 },
          accuracy: { min: 0.8, max: 1.0 },
          throughput: { min: 100, max: 10000 }
        },
        algorithm: 'bayesian',
        maxIterations: 1000
      }
    ]

    const results: OptimizationResult[] = []
    
    for (const optimizationConfig of izaOptimizations) {
      try {
        const result = await this.runOptimization(optimizationConfig)
        results.push(result)
      } catch (error) {
        console.error(`Error running optimization ${optimizationConfig.objective}:`, error)
      }
    }

    return results
  }

  // System Statistics
  async getSystemStatistics(): Promise<{
    totalTasks: number
    activeTasks: number
    completedTasks: number
    totalOptimizations: number
    totalModels: number
    averageAccuracy: number
    averageTrainingTime: number
    totalInsights: number
    highImpactInsights: number
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return {
        totalTasks: data.total_tasks || 0,
        activeTasks: data.active_tasks || 0,
        completedTasks: data.completed_tasks || 0,
        totalOptimizations: data.total_optimizations || 0,
        totalModels: data.total_models || 0,
        averageAccuracy: data.average_accuracy || 0,
        averageTrainingTime: data.average_training_time || 0,
        totalInsights: data.total_insights || 0,
        highImpactInsights: data.high_impact_insights || 0
      }
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      const tasks = Array.from(this.learningTasks.values())
      const optimizations = Array.from(this.optimizationResults.values())
      const performance = Array.from(this.modelPerformance.values())
      const insights = Array.from(this.learningInsights.values())

      return {
        totalTasks: tasks.length,
        activeTasks: tasks.filter(t => t.status === 'training').length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        totalOptimizations: optimizations.length,
        totalModels: performance.length,
        averageAccuracy: performance.reduce((sum, p) => sum + p.accuracy, 0) / performance.length || 0,
        averageTrainingTime: performance.reduce((sum, p) => sum + p.trainingTime, 0) / performance.length || 0,
        totalInsights: insights.length,
        highImpactInsights: insights.filter(i => i.impact === 'high' || i.impact === 'critical').length
      }
    }
  }

  // System Overview
  async getSystemOverview(): Promise<{
    health: boolean
    totalTasks: number
    activeOptimizations: number
    averageAccuracy: number
    totalInsights: number
    systemResources: {
      cpuUsage: number
      memoryUsage: number
      gpuUsage: number
    }
  }> {
    try {
      const [health, statistics] = await Promise.all([
        this.checkHealth(),
        this.getSystemStatistics()
      ])

      return {
        health,
        totalTasks: statistics.totalTasks,
        activeOptimizations: statistics.totalOptimizations,
        averageAccuracy: statistics.averageAccuracy,
        totalInsights: statistics.totalInsights,
        systemResources: {
          cpuUsage: 35, // Mock data
          memoryUsage: 60,
          gpuUsage: 45
        }
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        totalTasks: 0,
        activeOptimizations: 0,
        averageAccuracy: 0,
        totalInsights: 0,
        systemResources: {
          cpuUsage: 0,
          memoryUsage: 0,
          gpuUsage: 0
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
export const bitNetService = new BitNetService()
export default bitNetService
