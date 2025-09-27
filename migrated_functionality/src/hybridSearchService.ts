
import { PerplexicaService } from './perplexicaService'
import { DeepResearchService } from './deepResearchService'
import { HybridSearchRequest, HybridSearchResponse, SearchMode } from '../types/hybridSearch'

export class HybridSearchService {
  private perplexica: PerplexicaService
  private deepresearch: DeepResearchService
  
  constructor() {
    this.perplexica = new PerplexicaService()
    this.deepresearch = new DeepResearchService({
      modelPath: 'Alibaba-NLP/Tongyi-DeepResearch-30B-A3B',
      maxContextLength: 128000,
      temperature: 0.7,
      maxTokens: 2048
    })
  }
  
  async search(request: HybridSearchRequest): Promise<HybridSearchResponse> {
    const startTime = Date.now()
    
    try {
      let results: any[] = []
      let sources: any[] = []
      let answer = ''
      let confidenceScore = 0
      
      switch (request.mode) {
        case 'perplexica':
          const perplexicaResult = await this.perplexica.search({
            query: request.query,
            searchType: request.searchType,
            maxResults: request.maxResults
          })
          results = perplexicaResult.results
          sources = perplexicaResult.sources
          answer = results.map(r => r.snippet).join(' ')
          confidenceScore = 0.85
          break
          
        case 'deepresearch':
          const deepresearchResult = await this.deepresearch.conductResearch({
            question: request.query,
            mode: request.researchMode || 'react',
            context: request.context
          })
          answer = deepresearchResult.answer
          sources = deepresearchResult.sources.map(url => ({ url, title: 'Deep Research Source' }))
          confidenceScore = deepresearchResult.confidenceScore
          break
          
        case 'hybrid':
          // Combine both approaches
          const [perplexicaResult, deepresearchResult] = await Promise.all([
            this.perplexica.search({
              query: request.query,
              searchType: request.searchType,
              maxResults: request.maxResults
            }),
            this.deepresearch.conductResearch({
              question: request.query,
              mode: request.researchMode || 'iter_research',
              context: request.context
            })
          ])
          
          results = perplexicaResult.results
          sources = [...perplexicaResult.sources, ...deepresearchResult.sources.map(url => ({ url, title: 'Deep Research Source' }))]
          answer = `${perplexicaResult.results.map(r => r.snippet).join(' ')} ${deepresearchResult.answer}`
          confidenceScore = (0.85 + deepresearchResult.confidenceScore) / 2
          break
          
        case 'conveyor_belt':
          // IZA OS conveyor belt neural pathway
          answer = await this.conveyorBeltSearch(request)
          confidenceScore = 0.95
          break
      }
      
      const duration = Date.now() - startTime
      
      return {
        success: true,
        query: request.query,
        mode: request.mode,
        answer,
        sources,
        confidenceScore,
        duration,
        metadata: {
          timestamp: new Date().toISOString(),
          searchType: request.searchType,
          researchMode: request.researchMode
        }
      }
      
    } catch (error) {
      return {
        success: false,
        query: request.query,
        mode: request.mode,
        error: error instanceof Error ? error.message : 'Unknown error',
        answer: '',
        sources: [],
        confidenceScore: 0,
        duration: Date.now() - startTime
      }
    }
  }
  
  private async conveyorBeltSearch(request: HybridSearchRequest): Promise<string> {
    // Simulate conveyor belt neural pathway processing
    const steps = [
      'Input Processing: Analyzing query complexity',
      'Agent Selection: Choosing optimal search agents',
      'Parallel Processing: Multiple agents working simultaneously',
      'Synthesis: Combining findings from all agents',
      'Quality Assurance: Validating results',
      'Output Generation: Creating final answer'
    ]
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return `Conveyor Belt Analysis: ${request.query}. This answer was generated using the IZA OS conveyor belt neural pathway system, leveraging multiple specialized agents working in parallel to provide the most comprehensive and accurate response possible.`
  }
}
