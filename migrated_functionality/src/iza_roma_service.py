"""
IZA OS ROMA Integration Service
Meta-agent orchestration for 1,842-agent ecosystem
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
from iza_roma_config import get_roma_config, get_iza_context, get_agent_templates, validate_environment

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IZAROMAService:
    """IZA OS ROMA Meta-Agent Service"""
    
    def __init__(self):
        self.config = get_roma_config()
        self.context = get_iza_context()
        self.templates = get_agent_templates()
        self.session = None
        
        if not validate_environment():
            raise ValueError("Missing required environment variables")
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def decompose_task(self, task: str, agent_type: str = 'orchestration_maestro') -> List[Dict[str, Any]]:
        """Decompose complex task into subtasks using ROMA framework"""
        
        template = self.templates.get(agent_type, self.templates['orchestration_maestro'])
        
        decomposition_prompt = f"""
IZA OS Task Decomposition Request:
Ecosystem Value: {self.context['ecosystem_value']}
Agent Count: {self.context['agent_count']}
Automation Level: {self.context['automation_level']}

Task: {task}
Agent Type: {agent_type}
Capabilities: {template['capabilities']}
Max Recursion Depth: {template['recursion_depth']}

Decompose this task into manageable subtasks with clear dependencies and success criteria.
Each subtask should be actionable and measurable.
"""
        
        # Use OpenAI for task decomposition
        subtasks = await self._call_openai_api(decomposition_prompt, max_tokens=2000)
        
        return self._parse_subtasks(subtasks)
    
    async def execute_subtask(self, subtask: Dict[str, Any], agent_type: str) -> Dict[str, Any]:
        """Execute individual subtask using appropriate agent"""
        
        template = self.templates.get(agent_type, self.templates['orchestration_maestro'])
        
        # Choose best model for subtask
        model_provider = self._select_model_provider(subtask, template)
        
        if model_provider == 'huggingface':
            return await self._execute_with_huggingface(subtask, template)
        elif model_provider == 'openai':
            return await self._execute_with_openai(subtask, template)
        elif model_provider == 'anthropic':
            return await self._execute_with_anthropic(subtask, template)
        else:
            raise ValueError(f"Unknown model provider: {model_provider}")
    
    async def orchestrate_complex_task(self, task: str, agent_type: str = 'orchestration_maestro') -> Dict[str, Any]:
        """Orchestrate complex task using ROMA recursive framework"""
        
        start_time = datetime.now()
        
        # Step 1: Decompose task
        subtasks = await self.decompose_task(task, agent_type)
        
        # Step 2: Execute subtasks in parallel where possible
        results = []
        for subtask in subtasks:
            if subtask.get('parallel', False):
                # Execute in parallel
                result = await self.execute_subtask(subtask, agent_type)
                results.append(result)
            else:
                # Execute sequentially
                result = await self.execute_subtask(subtask, agent_type)
                results.append(result)
        
        # Step 3: Synthesize results
        synthesis_result = await self._synthesize_results(results, task)
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return {
            'task': task,
            'agent_type': agent_type,
            'subtasks_count': len(subtasks),
            'results': results,
            'synthesis': synthesis_result,
            'execution_time': execution_time,
            'success': True,
            'iza_context': self.context
        }
    
    async def _call_openai_api(self, prompt: str, max_tokens: int = 1000) -> str:
        """Call OpenAI API"""
        headers = {
            'Authorization': f'Bearer {self.config["agent_providers"]["openai"]["api_key"]}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': self.config['agent_providers']['openai']['model'],
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': max_tokens,
            'temperature': self.config['agent_providers']['openai']['temperature']
        }
        
        async with self.session.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=payload
        ) as response:
            data = await response.json()
            return data['choices'][0]['message']['content']
    
    async def _execute_with_huggingface(self, subtask: Dict[str, Any], template: Dict[str, Any]) -> Dict[str, Any]:
        """Execute subtask using Hugging Face models"""
        
        # Select appropriate HF model
        hf_model = self._select_hf_model(subtask, template)
        
        payload = {
            'prompt': subtask['description'],
            'model_type': hf_model,
            'max_tokens': 1000,
            'temperature': 0.7
        }
        
        async with self.session.post(
            f"{self.config['agent_providers']['huggingface']['base_url']}/{hf_model}",
            json=payload
        ) as response:
            data = await response.json()
            
            return {
                'subtask_id': subtask.get('id'),
                'description': subtask['description'],
                'model': hf_model,
                'result': data.get('content', ''),
                'success': data.get('success', False),
                'execution_time': data.get('execution_time', 0),
                'tokens_used': data.get('tokens_used', 0),
                'cost': data.get('cost', 0)
            }
    
    async def _execute_with_openai(self, subtask: Dict[str, Any], template: Dict[str, Any]) -> Dict[str, Any]:
        """Execute subtask using OpenAI"""
        prompt = f"""
IZA OS Subtask Execution:
{subtask['description']}

Agent Capabilities: {template['capabilities']}
Ecosystem Context: {self.context['ecosystem_value']}

Provide detailed execution result.
"""
        
        result = await self._call_openai_api(prompt)
        
        return {
            'subtask_id': subtask.get('id'),
            'description': subtask['description'],
            'model': 'openai',
            'result': result,
            'success': True,
            'execution_time': 0,
            'tokens_used': 0,
            'cost': 0
        }
    
    async def _execute_with_anthropic(self, subtask: Dict[str, Any], template: Dict[str, Any]) -> Dict[str, Any]:
        """Execute subtask using Anthropic"""
        # Similar implementation to OpenAI
        pass
    
    def _select_model_provider(self, subtask: Dict[str, Any], template: Dict[str, Any]) -> str:
        """Select best model provider for subtask"""
        # Logic to select between HF, OpenAI, Anthropic based on subtask requirements
        return 'huggingface'  # Default to HF for now
    
    def _select_hf_model(self, subtask: Dict[str, Any], template: Dict[str, Any]) -> str:
        """Select best Hugging Face model for subtask"""
        # Logic to select appropriate HF model
        return 'ceo'  # Default to CEO model
    
    def _parse_subtasks(self, decomposition_text: str) -> List[Dict[str, Any]]:
        """Parse task decomposition into structured subtasks"""
        # Simple parsing logic - in production, use more sophisticated parsing
        lines = decomposition_text.split('\n')
        subtasks = []
        
        for i, line in enumerate(lines):
            if line.strip() and not line.startswith('#'):
                subtasks.append({
                    'id': f'subtask_{i}',
                    'description': line.strip(),
                    'parallel': i % 2 == 0,  # Simple parallel logic
                    'dependencies': []
                })
        
        return subtasks
    
    async def _synthesize_results(self, results: List[Dict[str, Any]], original_task: str) -> str:
        """Synthesize subtask results into final output"""
        
        synthesis_prompt = f"""
IZA OS Result Synthesis:
Original Task: {original_task}
Ecosystem Value: {self.context['ecosystem_value']}
Agent Count: {self.context['agent_count']}

Subtask Results:
{json.dumps(results, indent=2)}

Synthesize these results into a comprehensive final output.
"""
        
        return await self._call_openai_api(synthesis_prompt, max_tokens=2000)

# Example usage
async def main():
    """Example usage of IZA OS ROMA Service"""
    
    async with IZAROMAService() as service:
        # Test complex task orchestration
        result = await service.orchestrate_complex_task(
            "Create a comprehensive strategic plan for IZA OS expansion into European markets",
            "strategic_planner"
        )
        
        print("IZA OS ROMA Orchestration Result:")
        print("=================================")
        print(f"Task: {result['task']}")
        print(f"Subtasks: {result['subtasks_count']}")
        print(f"Execution Time: {result['execution_time']:.2f}s")
        print(f"Success: {result['success']}")
        print(f"Synthesis: {result['synthesis'][:200]}...")

if __name__ == "__main__":
    asyncio.run(main())
