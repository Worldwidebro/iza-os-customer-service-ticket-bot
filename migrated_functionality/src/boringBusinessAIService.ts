import { ollamaService } from './ollamaService';
import toast from 'react-hot-toast';

interface GoogleMapsBusiness {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviews: number;
  category: string;
  revenue_estimate: number;
  competition_score: number;
  opportunity_score: number;
  ai_automation_potential: number;
  stealth_factor: number;
}

interface BoringBusinessIdea {
  business_type: string;
  description: string;
  startup_cost: number;
  monthly_revenue_potential: number;
  competition_level: string;
  scalability: string;
  ai_automation_potential: number;
  stealth_factor: number;
  implementation_steps: string[];
  revenue_streams: string[];
  automation_workflows: string[];
}

interface N8NWorkflow {
  name: string;
  description: string;
  triggers: string[];
  actions: string[];
  automation_level: number;
  revenue_impact: number;
  implementation_complexity: string;
  time_to_profit: string;
}

interface BusinessAnalysis {
  market_size: number;
  competition_analysis: string;
  revenue_optimization: string[];
  ai_automation_opportunities: string[];
  stealth_scaling_methods: string[];
  risk_assessment: string[];
  action_plan: string[];
  profit_timeline: string;
}

class BoringBusinessAIService {
  private ollamaModel: string = 'llama3.2:3b';

  constructor() {
    if (ollamaService.getConnectionStatus().connected && ollamaService.getConnectionStatus().model) {
      this.ollamaModel = ollamaService.getConnectionStatus().model;
    }
  }

  public setOllamaModel(modelName: string): void {
    if (ollamaService.getAvailableModels().some(m => m.name === modelName)) {
      this.ollamaModel = modelName;
      ollamaService.setCurrentModel(modelName);
      toast.success(`Boring Business AI using model: ${modelName}`);
    } else {
      toast.error(`Model ${modelName} not found for Boring Business AI`);
    }
  }

  public async scrapeGoogleMapsBusinesses(
    location: string, 
    category: string, 
    radius: number = 10
  ): Promise<GoogleMapsBusiness[]> {
    const prompt = `Analyze Google Maps business data for ${location} in the ${category} category within ${radius} miles.
    
    Provide detailed business information for 15 businesses including:
    - Business name, address, phone, website
    - Rating (1-5) and review count
    - Estimated monthly revenue potential
    - Competition score (0-100, lower = less competition)
    - Opportunity score (0-100, higher = better opportunity)
    - AI automation potential (0-100%)
    - Stealth factor (0-100%, how quietly it can be operated)
    
    Focus on boring but profitable businesses that can be automated with AI.
    Prioritize businesses with:
    - Low competition scores (< 30)
    - High opportunity scores (> 70)
    - High AI automation potential (> 80%)
    - High stealth factors (> 80%)
    
    Return data in JSON format with array of businesses.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are an expert business analyst specializing in identifying profitable boring businesses with high automation potential. Focus on businesses that can quietly generate significant revenue.",
        temperature: 0.3,
        maxTokens: 2048
      });

      const data = JSON.parse(response);
      return data.businesses || [];
    } catch (error) {
      console.error('Error scraping Google Maps businesses:', error);
      throw error;
    }
  }

  public async generateBoringBusinessIdeas(): Promise<BoringBusinessIdea[]> {
    const prompt = `Generate 20 boring but highly profitable business ideas that can be quietly scaled with AI automation.
    
    Focus on businesses that:
    - Have low competition but high demand
    - Can be automated 80%+ with AI
    - Operate stealthily (quiet money making)
    - Scale without attracting attention
    - Generate $10K-$100K monthly revenue potential
    - Require minimal startup capital ($1K-$50K)
    
    For each idea, provide:
    - Business type and detailed description
    - Startup cost estimate (realistic)
    - Monthly revenue potential (conservative to optimistic)
    - Competition level (Low/Medium/High)
    - Scalability rating (Low/Medium/High)
    - AI automation potential (0-100%)
    - Stealth factor (0-100%)
    - Implementation steps (5-7 steps)
    - Revenue streams (3-5 streams)
    - Automation workflows (3-5 workflows)
    
    Examples of good boring businesses:
    - Local service businesses (cleaning, maintenance, etc.)
    - Digital services (SEO, content, etc.)
    - E-commerce niches
    - Subscription services
    - Local lead generation
    - Property management
    - Automated content creation
    - Local business optimization
    
    Return in JSON format with array of ideas.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are a stealth business strategist who specializes in identifying boring businesses that quietly print money with AI automation. Focus on practical, implementable ideas.",
        temperature: 0.6,
        maxTokens: 2048
      });

      const data = JSON.parse(response);
      return data.ideas || [];
    } catch (error) {
      console.error('Error generating business ideas:', error);
      throw error;
    }
  }

  public async analyzeBusinessOpportunity(business: GoogleMapsBusiness): Promise<BusinessAnalysis> {
    const prompt = `Analyze the business opportunity for "${business.name}" in the ${business.category} category.
    
    Provide comprehensive analysis including:
    - Market size estimate (total addressable market)
    - Competition analysis (strengths, weaknesses, opportunities)
    - Revenue optimization strategies (5-7 strategies)
    - AI automation opportunities (5-7 specific automations)
    - Stealth scaling methods (how to grow quietly)
    - Risk assessment (5-7 potential risks)
    - Action plan for implementation (7-10 steps)
    - Profit timeline (realistic timeline to profitability)
    
    Focus on:
    - How to quietly build this into a profitable AI-automated business
    - Avoiding competition and attention
    - Maximizing revenue with minimal effort
    - Scaling without detection
    - Risk mitigation strategies
    
    Return in JSON format.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are a business optimization expert who specializes in turning boring businesses into AI-powered profit machines. Focus on stealth operations and maximum profitability.",
        temperature: 0.4,
        maxTokens: 1536
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing business opportunity:', error);
      throw error;
    }
  }

  public async generateN8NWorkflows(): Promise<N8NWorkflow[]> {
    const prompt = `Generate 25 n8n workflow templates for automating boring businesses and quietly printing money.
    
    Include workflows for:
    1. Google Maps data scraping and analysis
    2. Lead generation and qualification
    3. Customer communication automation
    4. Revenue optimization
    5. Competitor monitoring
    6. Market research automation
    7. Social media management
    8. Email marketing automation
    9. Appointment scheduling
    10. Payment processing
    11. Inventory management
    12. Customer feedback collection
    13. Review management
    14. SEO optimization
    15. Local business listing management
    16. Competitor price monitoring
    17. Market trend analysis
    18. Customer retention
    19. Upselling automation
    20. Financial reporting
    21. Lead nurturing
    22. Content creation automation
    23. Social proof generation
    24. Customer onboarding
    25. Performance analytics
    
    For each workflow, provide:
    - Workflow name and detailed description
    - Trigger events (what starts the workflow)
    - Action steps (what the workflow does)
    - Automation level (0-100%)
    - Revenue impact potential (0-100%)
    - Implementation complexity (Easy/Medium/Hard)
    - Time to profit (immediate/1-3 months/3-6 months/6+ months)
    
    Focus on workflows that:
    - Automate repetitive tasks
    - Generate leads and revenue
    - Require minimal maintenance
    - Scale easily
    - Operate quietly
    
    Return in JSON format with array of workflows.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are an n8n workflow automation expert specializing in business process automation for maximum profit with minimal effort. Focus on practical, implementable workflows.",
        temperature: 0.5,
        maxTokens: 2048
      });

      const data = JSON.parse(response);
      return data.workflows || [];
    } catch (error) {
      console.error('Error generating n8n workflows:', error);
      throw error;
    }
  }

  public async generateRevenueOptimizationStrategies(businessType: string): Promise<string[]> {
    const prompt = `Generate 15 revenue optimization strategies for a ${businessType} business.
    
    Focus on strategies that:
    - Increase revenue without increasing costs significantly
    - Can be automated with AI
    - Operate quietly (stealth mode)
    - Scale easily
    - Require minimal upfront investment
    
    Include strategies for:
    - Pricing optimization
    - Upselling and cross-selling
    - Customer retention
    - Lead generation
    - Market expansion
    - Service diversification
    - Automation opportunities
    - Partnership opportunities
    
    Return as an array of specific, actionable strategies.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are a revenue optimization expert specializing in stealth business growth and AI automation. Focus on practical strategies that can be implemented quickly.",
        temperature: 0.5,
        maxTokens: 1024
      });

      const data = JSON.parse(response);
      return data.strategies || [];
    } catch (error) {
      console.error('Error generating revenue strategies:', error);
      throw error;
    }
  }

  public async generateStealthScalingPlan(businessIdea: BoringBusinessIdea): Promise<string[]> {
    const prompt = `Create a stealth scaling plan for a ${businessIdea.business_type} business.
    
    The plan should include steps to:
    - Scale quietly without attracting competition
    - Automate operations with AI
    - Maximize revenue with minimal effort
    - Avoid detection by competitors
    - Build sustainable competitive advantages
    
    Provide 12-15 specific, actionable steps that can be implemented over 6-12 months.
    
    Focus on:
    - Automation implementation
    - Revenue optimization
    - Market expansion
    - Competitive advantage building
    - Risk mitigation
    - Stealth operations
    
    Return as an array of specific steps.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are a stealth business scaling expert who specializes in growing businesses quietly and profitably. Focus on practical, implementable steps.",
        temperature: 0.4,
        maxTokens: 1024
      });

      const data = JSON.parse(response);
      return data.steps || [];
    } catch (error) {
      console.error('Error generating stealth scaling plan:', error);
      throw error;
    }
  }

  public async analyzeCompetition(businessType: string, location: string): Promise<any> {
    const prompt = `Analyze the competition for ${businessType} businesses in ${location}.
    
    Provide analysis including:
    - Number of competitors
    - Market saturation level
    - Competitor strengths and weaknesses
    - Pricing analysis
    - Service quality assessment
    - Market gaps and opportunities
    - Competitive advantages to exploit
    - Barriers to entry
    - Market trends
    
    Focus on identifying opportunities to:
    - Enter the market quietly
    - Compete effectively
    - Build competitive advantages
    - Avoid direct competition
    - Find underserved niches
    
    Return in JSON format.`;

    try {
      const response = await ollamaService.sendMessage(prompt, this.ollamaModel, {
        systemPrompt: "You are a competitive analysis expert specializing in identifying market opportunities and competitive advantages. Focus on practical insights for business success.",
        temperature: 0.3,
        maxTokens: 1024
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing competition:', error);
      throw error;
    }
  }
}

export const boringBusinessAIService = new BoringBusinessAIService();
