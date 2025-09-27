// X Recommendation Algorithm Integration for IZA OS
// Based on Twitter's recommendation system architecture

interface RecommendationConfig {
  baseUrl: string
  apiKey?: string
  businessGroup: string
}

interface CandidateSource {
  id: string
  name: string
  type: 'agent' | 'content' | 'business_action' | 'resource'
  weight: number
  description: string
}

interface RankingModel {
  id: string
  name: string
  type: 'light_ranker' | 'heavy_ranker'
  version: string
  accuracy: number
  latency: number
}

interface RecommendationItem {
  id: string
  type: string
  score: number
  confidence: number
  metadata: Record<string, any>
  source: string
  timestamp: string
}

interface UserProfile {
  id: string
  preferences: Record<string, number>
  behaviorHistory: Array<{
    action: string
    timestamp: string
    context: Record<string, any>
  }>
  expertise: string[]
  goals: string[]
}

interface RecommendationRequest {
  userId: string
  context: {
    currentTask?: string
    businessGoal?: string
    resourceConstraints?: Record<string, any>
    timeHorizon?: string
  }
  candidateTypes: string[]
  maxResults: number
}

class XRecommendationService {
  private config: RecommendationConfig
  private candidateSources: CandidateSource[]
  private rankingModels: RankingModel[]

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:18000', // X Algorithm API port
      businessGroup: 'iza-os-ecosystem'
    }

    // Initialize candidate sources based on X's architecture
    this.candidateSources = [
      {
        id: 'agent_search_index',
        name: 'Agent Search Index',
        type: 'agent',
        weight: 0.5,
        description: 'Find and rank AI agents for specific tasks (~50% of recommendations)'
      },
      {
        id: 'business_action_mixer',
        name: 'Business Action Mixer',
        type: 'business_action',
        weight: 0.3,
        description: 'Coordination layer for business strategy recommendations'
      },
      {
        id: 'resource_graph',
        name: 'Resource Graph',
        type: 'resource',
        weight: 0.2,
        description: 'Maintains resource allocation graph and finds optimal allocations'
      }
    ]

    // Initialize ranking models
    this.rankingModels = [
      {
        id: 'light_ranker',
        name: 'Light Ranker',
        type: 'light_ranker',
        version: 'v2.1',
        accuracy: 0.85,
        latency: 50
      },
      {
        id: 'heavy_ranker',
        name: 'Heavy Ranker',
        type: 'heavy_ranker',
        version: 'v3.0',
        accuracy: 0.92,
        latency: 200
      }
    ]
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

  // Get recommendations using X's algorithm architecture
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    try {
      // Step 1: Candidate Sourcing (like X's For You Timeline)
      const candidates = await this.sourceCandidates(request)
      
      // Step 2: Light Ranking (pre-selection)
      const lightRanked = await this.lightRanking(candidates, request)
      
      // Step 3: Heavy Ranking (final scoring)
      const heavyRanked = await this.heavyRanking(lightRanked, request)
      
      // Step 4: Post-processing and filtering
      const finalRecommendations = await this.postProcessRecommendations(heavyRanked, request)
      
      return finalRecommendations.slice(0, request.maxResults)
    } catch (error) {
      console.error('Error getting recommendations:', error)
      return []
    }
  }

  // Candidate sourcing (inspired by X's search-index and tweet-mixer)
  private async sourceCandidates(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const candidates: RecommendationItem[] = []

    for (const source of this.candidateSources) {
      if (request.candidateTypes.includes(source.type)) {
        try {
          const sourceCandidates = await this.fetchFromSource(source, request)
          candidates.push(...sourceCandidates)
        } catch (error) {
          console.error(`Error fetching from ${source.name}:`, error)
        }
      }
    }

    return candidates
  }

  // Light ranking (inspired by X's light-ranker)
  private async lightRanking(candidates: RecommendationItem[], request: RecommendationRequest): Promise<RecommendationItem[]> {
    const lightRanker = this.rankingModels.find(m => m.type === 'light_ranker')
    if (!lightRanker) return candidates

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/light-rank`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          candidates,
          userId: request.userId,
          context: request.context,
          model: lightRanker.id
        })
      })

      const data = await response.json()
      return data.rankedCandidates || candidates
    } catch (error) {
      console.error('Error in light ranking:', error)
      return candidates
    }
  }

  // Heavy ranking (inspired by X's heavy-ranker)
  private async heavyRanking(candidates: RecommendationItem[], request: RecommendationRequest): Promise<RecommendationItem[]> {
    const heavyRanker = this.rankingModels.find(m => m.type === 'heavy_ranker')
    if (!heavyRanker) return candidates

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/heavy-rank`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          candidates,
          userId: request.userId,
          context: request.context,
          model: heavyRanker.id
        })
      })

      const data = await response.json()
      return data.rankedCandidates || candidates
    } catch (error) {
      console.error('Error in heavy ranking:', error)
      return candidates
    }
  }

  // Post-processing (inspired by X's home-mixer and visibility-filters)
  private async postProcessRecommendations(candidates: RecommendationItem[], request: RecommendationRequest): Promise<RecommendationItem[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/post-process`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          candidates,
          userId: request.userId,
          context: request.context
        })
      })

      const data = await response.json()
      return data.processedCandidates || candidates
    } catch (error) {
      console.error('Error in post-processing:', error)
      return candidates
    }
  }

  // Fetch candidates from specific source
  private async fetchFromSource(source: CandidateSource, request: RecommendationRequest): Promise<RecommendationItem[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/sources/${source.id}/candidates`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          userId: request.userId,
          context: request.context,
          maxResults: Math.floor(request.maxResults * source.weight)
        })
      })

      const data = await response.json()
      return data.candidates || []
    } catch (error) {
      console.error(`Error fetching from source ${source.id}:`, error)
      return []
    }
  }

  // Get agent recommendations for specific tasks
  async getAgentRecommendations(task: string, userId: string): Promise<RecommendationItem[]> {
    const request: RecommendationRequest = {
      userId,
      context: {
        currentTask: task,
        businessGoal: 'optimize_task_completion',
        timeHorizon: 'immediate'
      },
      candidateTypes: ['agent'],
      maxResults: 10
    }

    return this.getRecommendations(request)
  }

  // Get business strategy recommendations
  async getBusinessRecommendations(goal: string, userId: string): Promise<RecommendationItem[]> {
    const request: RecommendationRequest = {
      userId,
      context: {
        businessGoal: goal,
        timeHorizon: 'long_term'
      },
      candidateTypes: ['business_action'],
      maxResults: 5
    }

    return this.getRecommendations(request)
  }

  // Get resource optimization recommendations
  async getResourceRecommendations(constraints: Record<string, any>, userId: string): Promise<RecommendationItem[]> {
    const request: RecommendationRequest = {
      userId,
      context: {
        resourceConstraints: constraints,
        businessGoal: 'optimize_resource_allocation'
      },
      candidateTypes: ['resource'],
      maxResults: 8
    }

    return this.getRecommendations(request)
  }

  // Get content recommendations (like X's For You Timeline)
  async getContentRecommendations(userId: string, contentType: string = 'all'): Promise<RecommendationItem[]> {
    const request: RecommendationRequest = {
      userId,
      context: {
        currentTask: 'content_consumption',
        timeHorizon: 'short_term'
      },
      candidateTypes: ['content'],
      maxResults: 20
    }

    return this.getRecommendations(request)
  }

  // Update user profile based on interactions
  async updateUserProfile(userId: string, interaction: {
    action: string
    itemId: string
    context: Record<string, any>
    timestamp: string
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/users/${userId}/profile`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(interaction)
      })

      return response.ok
    } catch (error) {
      console.error('Error updating user profile:', error)
      return false
    }
  }

  // Get recommendation analytics
  async getRecommendationAnalytics(): Promise<{
    totalRecommendations: number
    clickThroughRate: number
    conversionRate: number
    topPerformingSources: Array<{ source: string; performance: number }>
    modelPerformance: Array<{ model: string; accuracy: number; latency: number }>
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/analytics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.analytics || {
        totalRecommendations: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        topPerformingSources: [],
        modelPerformance: []
      }
    } catch (error) {
      console.error('Error fetching recommendation analytics:', error)
      return {
        totalRecommendations: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        topPerformingSources: [],
        modelPerformance: []
      }
    }
  }

  // Get system overview
  async getSystemOverview(): Promise<{
    health: boolean
    activeSources: number
    totalModels: number
    recommendationsPerSecond: number
    averageLatency: number
  }> {
    try {
      const [health, analytics] = await Promise.all([
        this.checkHealth(),
        this.getRecommendationAnalytics()
      ])

      return {
        health,
        activeSources: this.candidateSources.length,
        totalModels: this.rankingModels.length,
        recommendationsPerSecond: analytics.totalRecommendations / 3600, // Approximate
        averageLatency: this.rankingModels.reduce((acc, model) => acc + model.latency, 0) / this.rankingModels.length
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        activeSources: 0,
        totalModels: 0,
        recommendationsPerSecond: 0,
        averageLatency: 0
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
export const xRecommendationService = new XRecommendationService()
export default xRecommendationService
