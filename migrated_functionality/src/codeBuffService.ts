// CodeBuff Integration for IZA OS
// AI-assisted development for "Optimize Through Learning" system

interface CodeBuffConfig {
  baseUrl: string
  apiKey?: string
  modelVersion: string
  maxTokens: number
  temperature: number
  supportedLanguages: string[]
  maxFileSize: number
}

interface CodeGenerationRequest {
  id: string
  prompt: string
  language: string
  context?: string
  requirements?: string[]
  style?: 'functional' | 'object-oriented' | 'procedural'
  complexity?: 'simple' | 'medium' | 'complex'
  status: 'pending' | 'generating' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  generatedCode?: string
  explanation?: string
  suggestions?: string[]
}

interface CodeReview {
  id: string
  codeId: string
  language: string
  issues: CodeIssue[]
  suggestions: CodeSuggestion[]
  score: number
  createdAt: string
  reviewer: string
}

interface CodeIssue {
  id: string
  type: 'bug' | 'performance' | 'security' | 'style' | 'maintainability'
  severity: 'low' | 'medium' | 'high' | 'critical'
  line: number
  column?: number
  message: string
  suggestion: string
  confidence: number
}

interface CodeSuggestion {
  id: string
  type: 'optimization' | 'refactoring' | 'enhancement' | 'documentation'
  description: string
  code: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
}

interface CodeTemplate {
  id: string
  name: string
  description: string
  language: string
  category: string
  template: string
  parameters: string[]
  usage: string
  popularity: number
}

interface CodeAnalysis {
  id: string
  codeId: string
  metrics: {
    linesOfCode: number
    cyclomaticComplexity: number
    maintainabilityIndex: number
    technicalDebt: number
    testCoverage: number
    duplicationRate: number
  }
  patterns: string[]
  dependencies: string[]
  vulnerabilities: string[]
  createdAt: string
}

class CodeBuffService {
  private config: CodeBuffConfig
  private generationRequests: Map<string, CodeGenerationRequest> = new Map()
  private codeReviews: Map<string, CodeReview> = new Map()
  private codeTemplates: Map<string, CodeTemplate> = new Map()
  private codeAnalyses: Map<string, CodeAnalysis> = new Map()

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:8013', // CodeBuff API server
      modelVersion: 'codebuff-1.0',
      maxTokens: 8192,
      temperature: 0.3,
      supportedLanguages: ['python', 'typescript', 'javascript', 'java', 'go', 'rust', 'cpp', 'csharp'],
      maxFileSize: 10 * 1024 * 1024 // 10MB
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

  // Code Generation
  async generateCode(config: {
    prompt: string
    language: string
    context?: string
    requirements?: string[]
    style?: 'functional' | 'object-oriented' | 'procedural'
    complexity?: 'simple' | 'medium' | 'complex'
  }): Promise<CodeGenerationRequest> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          prompt: config.prompt,
          language: config.language,
          context: config.context || '',
          requirements: config.requirements || [],
          style: config.style || 'object-oriented',
          complexity: config.complexity || 'medium',
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      })

      const data = await response.json()
      const request: CodeGenerationRequest = {
        id: data.id,
        prompt: config.prompt,
        language: config.language,
        context: config.context,
        requirements: config.requirements,
        style: config.style,
        complexity: config.complexity,
        status: 'generating',
        createdAt: new Date().toISOString(),
        generatedCode: data.generated_code,
        explanation: data.explanation,
        suggestions: data.suggestions || []
      }

      this.generationRequests.set(request.id, request)
      return request
    } catch (error) {
      console.error('Error generating code:', error)
      throw error
    }
  }

  async getGenerationRequest(requestId: string): Promise<CodeGenerationRequest | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/generate/${requestId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        return data.request
      }
      return null
    } catch (error) {
      console.error(`Error fetching generation request ${requestId}:`, error)
      return null
    }
  }

  async getGenerationRequests(): Promise<CodeGenerationRequest[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/generate`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.requests || []
    } catch (error) {
      console.error('Error fetching generation requests:', error)
      return Array.from(this.generationRequests.values())
    }
  }

  // Code Review
  async reviewCode(config: {
    code: string
    language: string
    context?: string
    focusAreas?: string[]
  }): Promise<CodeReview> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/review`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          code: config.code,
          language: config.language,
          context: config.context || '',
          focus_areas: config.focusAreas || ['bug', 'performance', 'security', 'style']
        })
      })

      const data = await response.json()
      const review: CodeReview = {
        id: data.id,
        codeId: data.code_id,
        language: config.language,
        issues: data.issues || [],
        suggestions: data.suggestions || [],
        score: data.score || 0,
        createdAt: new Date().toISOString(),
        reviewer: 'CodeBuff AI'
      }

      this.codeReviews.set(review.id, review)
      return review
    } catch (error) {
      console.error('Error reviewing code:', error)
      throw error
    }
  }

  async getCodeReviews(): Promise<CodeReview[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/review`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.reviews || []
    } catch (error) {
      console.error('Error fetching code reviews:', error)
      return Array.from(this.codeReviews.values())
    }
  }

  // Code Templates
  async getCodeTemplates(language?: string, category?: string): Promise<CodeTemplate[]> {
    try {
      const params = new URLSearchParams()
      if (language) params.append('language', language)
      if (category) params.append('category', category)

      const response = await fetch(`${this.config.baseUrl}/api/v1/templates?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.templates || []
    } catch (error) {
      console.error('Error fetching code templates:', error)
      return Array.from(this.codeTemplates.values())
    }
  }

  async createCodeTemplate(config: {
    name: string
    description: string
    language: string
    category: string
    template: string
    parameters: string[]
    usage: string
  }): Promise<CodeTemplate> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/templates`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          language: config.language,
          category: config.category,
          template: config.template,
          parameters: config.parameters,
          usage: config.usage
        })
      })

      const data = await response.json()
      const template: CodeTemplate = {
        id: data.id,
        name: config.name,
        description: config.description,
        language: config.language,
        category: config.category,
        template: config.template,
        parameters: config.parameters,
        usage: config.usage,
        popularity: 0
      }

      this.codeTemplates.set(template.id, template)
      return template
    } catch (error) {
      console.error('Error creating code template:', error)
      throw error
    }
  }

  // Code Analysis
  async analyzeCode(config: {
    code: string
    language: string
    includeMetrics?: boolean
    includePatterns?: boolean
    includeDependencies?: boolean
  }): Promise<CodeAnalysis> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          code: config.code,
          language: config.language,
          include_metrics: config.includeMetrics !== false,
          include_patterns: config.includePatterns !== false,
          include_dependencies: config.includeDependencies !== false
        })
      })

      const data = await response.json()
      const analysis: CodeAnalysis = {
        id: data.id,
        codeId: data.code_id,
        metrics: data.metrics || {
          linesOfCode: 0,
          cyclomaticComplexity: 0,
          maintainabilityIndex: 0,
          technicalDebt: 0,
          testCoverage: 0,
          duplicationRate: 0
        },
        patterns: data.patterns || [],
        dependencies: data.dependencies || [],
        vulnerabilities: data.vulnerabilities || [],
        createdAt: new Date().toISOString()
      }

      this.codeAnalyses.set(analysis.id, analysis)
      return analysis
    } catch (error) {
      console.error('Error analyzing code:', error)
      throw error
    }
  }

  async getCodeAnalyses(): Promise<CodeAnalysis[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/analyze`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data.analyses || []
    } catch (error) {
      console.error('Error fetching code analyses:', error)
      return Array.from(this.codeAnalyses.values())
    }
  }

  // IZA OS Specific Code Generation
  async generateIZAOSCode(): Promise<CodeGenerationRequest[]> {
    const izaCodeRequests = [
      {
        prompt: 'Create a FastAPI service for IZA OS agent management with CRUD operations',
        language: 'python',
        context: 'IZA OS ecosystem with 1,842 agents',
        requirements: ['FastAPI', 'SQLAlchemy', 'Pydantic', 'Authentication'],
        style: 'object-oriented' as const,
        complexity: 'medium' as const
      },
      {
        prompt: 'Create a React component for IZA OS dashboard with real-time metrics',
        language: 'typescript',
        context: 'IZA OS unified dashboard with glass-morphism design',
        requirements: ['React', 'TypeScript', 'Tailwind CSS', 'Real-time updates'],
        style: 'functional' as const,
        complexity: 'complex' as const
      },
      {
        prompt: 'Create a Docker Compose configuration for IZA OS microservices',
        language: 'yaml',
        context: 'IZA OS ecosystem with multiple AI services',
        requirements: ['PostgreSQL', 'Redis', 'Nginx', 'Monitoring'],
        style: 'procedural' as const,
        complexity: 'medium' as const
      },
      {
        prompt: 'Create a machine learning pipeline for IZA OS agent optimization',
        language: 'python',
        context: 'IZA OS agent performance optimization',
        requirements: ['scikit-learn', 'pandas', 'numpy', 'MLflow'],
        style: 'functional' as const,
        complexity: 'complex' as const
      },
      {
        prompt: 'Create a Kubernetes deployment configuration for IZA OS services',
        language: 'yaml',
        context: 'IZA OS production deployment',
        requirements: ['Horizontal Pod Autoscaler', 'Service Mesh', 'Monitoring'],
        style: 'procedural' as const,
        complexity: 'complex' as const
      }
    ]

    const generatedRequests: CodeGenerationRequest[] = []
    
    for (const requestConfig of izaCodeRequests) {
      try {
        const request = await this.generateCode(requestConfig)
        generatedRequests.push(request)
      } catch (error) {
        console.error(`Error generating code for ${requestConfig.prompt}:`, error)
      }
    }

    return generatedRequests
  }

  // IZA OS Specific Code Templates
  async createIZAOSCodeTemplates(): Promise<CodeTemplate[]> {
    const izaTemplates = [
      {
        name: 'IZA OS Agent Service',
        description: 'Template for creating IZA OS agent services',
        language: 'python',
        category: 'service',
        template: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio

app = FastAPI(title="{{service_name}}", version="1.0.0")

class AgentRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    max_tokens: int = 1000

class AgentResponse(BaseModel):
    response: str
    model: str
    execution_time: float
    tokens_used: int

@app.post("/agent/execute", response_model=AgentResponse)
async def execute_agent(request: AgentRequest):
    # IZA OS Agent execution logic
    pass

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "{{service_name}}"}
`,
        parameters: ['service_name'],
        usage: 'Use this template to create new IZA OS agent services'
      },
      {
        name: 'IZA OS Dashboard Component',
        description: 'Template for IZA OS dashboard components',
        language: 'typescript',
        category: 'component',
        template: `import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface {{ComponentName}}Props {
  data: any
  onUpdate?: (data: any) => void
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({ data, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // IZA OS data fetching logic
  }, [])

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {{title}}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* IZA OS component content */}
      </CardContent>
    </Card>
  )
}`,
        parameters: ['ComponentName', 'title'],
        usage: 'Use this template to create IZA OS dashboard components'
      },
      {
        name: 'IZA OS API Endpoint',
        description: 'Template for IZA OS API endpoints',
        language: 'python',
        category: 'endpoint',
        template: `from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/{{endpoint_name}}", tags=["{{endpoint_name}}"])

class {{ModelName}}Request(BaseModel):
    {{field_name}}: str
    # Add more fields as needed

class {{ModelName}}Response(BaseModel):
    id: str
    {{field_name}}: str
    created_at: str

@router.post("/", response_model={{ModelName}}Response)
async def create_{{endpoint_name}}(
    request: {{ModelName}}Request,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # IZA OS creation logic
    pass

@router.get("/", response_model=List[{{ModelName}}Response])
async def get_{{endpoint_name}}s(
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # IZA OS retrieval logic
    pass`,
        parameters: ['endpoint_name', 'ModelName', 'field_name'],
        usage: 'Use this template to create IZA OS API endpoints'
      }
    ]

    const createdTemplates: CodeTemplate[] = []
    
    for (const templateConfig of izaTemplates) {
      try {
        const template = await this.createCodeTemplate(templateConfig)
        createdTemplates.push(template)
      } catch (error) {
        console.error(`Error creating template ${templateConfig.name}:`, error)
      }
    }

    return createdTemplates
  }

  // System Statistics
  async getSystemStatistics(): Promise<{
    totalRequests: number
    completedRequests: number
    totalReviews: number
    totalTemplates: number
    totalAnalyses: number
    averageGenerationTime: number
    averageReviewScore: number
    mostUsedLanguage: string
    mostUsedTemplate: string
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const data = await response.json()
      return {
        totalRequests: data.total_requests || 0,
        completedRequests: data.completed_requests || 0,
        totalReviews: data.total_reviews || 0,
        totalTemplates: data.total_templates || 0,
        totalAnalyses: data.total_analyses || 0,
        averageGenerationTime: data.average_generation_time || 0,
        averageReviewScore: data.average_review_score || 0,
        mostUsedLanguage: data.most_used_language || 'python',
        mostUsedTemplate: data.most_used_template || 'service'
      }
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      const requests = Array.from(this.generationRequests.values())
      const reviews = Array.from(this.codeReviews.values())
      const templates = Array.from(this.codeTemplates.values())
      const analyses = Array.from(this.codeAnalyses.values())

      return {
        totalRequests: requests.length,
        completedRequests: requests.filter(r => r.status === 'completed').length,
        totalReviews: reviews.length,
        totalTemplates: templates.length,
        totalAnalyses: analyses.length,
        averageGenerationTime: 0,
        averageReviewScore: reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length || 0,
        mostUsedLanguage: 'python',
        mostUsedTemplate: 'service'
      }
    }
  }

  // System Overview
  async getSystemOverview(): Promise<{
    health: boolean
    totalRequests: number
    completedRequests: number
    totalReviews: number
    averageReviewScore: number
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
        totalRequests: statistics.totalRequests,
        completedRequests: statistics.completedRequests,
        totalReviews: statistics.totalReviews,
        averageReviewScore: statistics.averageReviewScore,
        systemResources: {
          cpuUsage: 40, // Mock data
          memoryUsage: 55,
          gpuUsage: 30
        }
      }
    } catch (error) {
      console.error('Error getting system overview:', error)
      return {
        health: false,
        totalRequests: 0,
        completedRequests: 0,
        totalReviews: 0,
        averageReviewScore: 0,
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
export const codeBuffService = new CodeBuffService()
export default codeBuffService
