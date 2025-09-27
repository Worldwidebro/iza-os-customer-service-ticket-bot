#!/usr/bin/env python3
"""
IZA OS Cursor Bot Integration
Enterprise-grade Cursor IDE integration for God Mode commands
"""

import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)

@dataclass
class ParsedCommand:
    """IZA OS parsed bot command"""
    category: str
    command: str
    params: Dict[str, Any]
    raw_text: str
    line_number: Optional[int] = None

class CursorBotIntegration:
    """
    IZA OS Cursor Bot Integration
    Parses and executes // [BOT:...] commands from Cursor IDE
    """
    
    def __init__(self, bot_commander=None, orchestrator=None):
        self.bot_commander = bot_commander
        self.orchestrator = orchestrator
        self.logger = logging.getLogger(__name__)
        
        # Command pattern for parsing
        self.command_pattern = re.compile(
            r'//\s*\[BOT:\s*([^:]+):\s*([^\]]+)(?:\s*,\s*([^\]]+))?\]',
            re.IGNORECASE
        )
        
        # Parameter pattern for parsing parameters
        self.param_pattern = re.compile(
            r'(\w+)\s*=\s*([^,]+)',
            re.IGNORECASE
        )
    
    def parse_bot_command(self, text: str, line_number: Optional[int] = None) -> Optional[ParsedCommand]:
        """
        Parse // [BOT:...] command from text
        
        Args:
            text: Text containing bot command
            line_number: Optional line number for context
            
        Returns:
            ParsedCommand or None if no valid command found
        """
        try:
            match = self.command_pattern.search(text)
            if not match:
                return None
            
            category = match.group(1).strip().lower()
            command = match.group(2).strip()
            params_text = match.group(3) if match.group(3) else ""
            
            # Parse parameters
            params = self._parse_parameters(params_text)
            
            return ParsedCommand(
                category=category,
                command=command,
                params=params,
                raw_text=match.group(0),
                line_number=line_number
            )
            
        except Exception as e:
            self.logger.error(f"IZA OS: Failed to parse bot command: {e}")
            return None
    
    def _parse_parameters(self, params_text: str) -> Dict[str, Any]:
        """Parse parameters from parameter string"""
        params = {}
        
        if not params_text.strip():
            return params
        
        try:
            # Try JSON parsing first
            if params_text.strip().startswith('{') and params_text.strip().endswith('}'):
                params = json.loads(params_text.strip())
            else:
                # Parse key=value pairs
                matches = self.param_pattern.findall(params_text)
                for key, value in matches:
                    # Try to parse value as JSON, fallback to string
                    try:
                        params[key] = json.loads(value.strip())
                    except (json.JSONDecodeError, ValueError):
                        # Remove quotes if present
                        value = value.strip().strip('"\'')
                        params[key] = value
                        
        except Exception as e:
            self.logger.warning(f"IZA OS: Failed to parse parameters '{params_text}': {e}")
        
        return params
    
    async def execute_god_mode_command(self, parsed_command: ParsedCommand) -> Dict[str, Any]:
        """
        Execute parsed God Mode command
        
        Args:
            parsed_command: Parsed command from text
            
        Returns:
            Execution result
        """
        try:
            if not self.bot_commander:
                return {
                    "status": "error",
                    "error": "IZA OS: Bot commander not available",
                    "execution_id": None
                }
            
            # Execute through bot commander
            result = self.bot_commander.execute_command(
                parsed_command.category,
                parsed_command.command,
                parsed_command.params
            )
            
            return result
            
        except Exception as e:
            self.logger.error(f"IZA OS: Failed to execute God Mode command: {e}")
            return {
                "status": "error",
                "error": str(e),
                "execution_id": None
            }
    
    async def stream_execution_results(self, execution_id: str, websocket=None) -> Dict[str, Any]:
        """
        Stream execution results via WebSocket
        
        Args:
            execution_id: Execution ID to monitor
            websocket: WebSocket connection for streaming
            
        Returns:
            Final execution result
        """
        try:
            if not self.bot_commander:
                return {"status": "error", "error": "IZA OS: Bot commander not available"}
            
            # Monitor execution status
            while True:
                execution = self.bot_commander.get_execution_status(execution_id)
                
                if not execution:
                    return {"status": "error", "error": "IZA OS: Execution not found"}
                
                # Stream status update
                if websocket:
                    await websocket.send(json.dumps({
                        "type": "execution_update",
                        "execution_id": execution_id,
                        "status": execution.status,
                        "logs": execution.logs[-5:] if execution.logs else [],  # Last 5 logs
                        "result": execution.result
                    }))
                
                # Check if execution is complete
                if execution.status in ["completed", "failed", "cancelled"]:
                    return {
                        "status": execution.status,
                        "result": execution.result,
                        "logs": execution.logs,
                        "error": execution.error
                    }
                
                # Wait before next check
                await asyncio.sleep(1)
                
        except Exception as e:
            self.logger.error(f"IZA OS: Failed to stream execution results: {e}")
            return {"status": "error", "error": str(e)}
    
    def validate_command_syntax(self, text: str) -> Tuple[bool, str]:
        """
        Validate bot command syntax
        
        Args:
            text: Text to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            parsed = self.parse_bot_command(text)
            
            if not parsed:
                return False, "IZA OS: No valid bot command found"
            
            # Validate category
            valid_categories = [
                "chat", "trading", "social_media", "rpa", "game",
                "red_team", "research", "creative", "physical_world", "meta"
            ]
            
            if parsed.category not in valid_categories:
                return False, f"IZA OS: Invalid category '{parsed.category}'. Valid categories: {', '.join(valid_categories)}"
            
            # Validate command name
            if not parsed.command or len(parsed.command.strip()) == 0:
                return False, "IZA OS: Command name cannot be empty"
            
            return True, "IZA OS: Command syntax is valid"
            
        except Exception as e:
            return False, f"IZA OS: Syntax validation error: {str(e)}"
    
    def get_command_examples(self) -> List[Dict[str, str]]:
        """Get example bot commands for each category"""
        return [
            {
                "category": "chat",
                "command": "empathy_engine",
                "example": "// [BOT:chat:empathy_engine, user_input=\"Hello\", context=\"support\"]",
                "description": "Detects user frustration and escalates to human"
            },
            {
                "category": "trading",
                "command": "risk_warden",
                "example": "// [BOT:trading:risk_warden, portfolio=\"crypto\", risk_threshold=0.1]",
                "description": "Auto-sell on drawdown with stablecoin protection"
            },
            {
                "category": "social_media",
                "command": "viral_alchemist",
                "example": "// [BOT:social_media:viral_alchemist, content=\"product launch\", platform=\"twitter\"]",
                "description": "Analyzes viral potential and generates variants"
            },
            {
                "category": "rpa",
                "command": "element_hunter",
                "example": "// [BOT:rpa:element_hunter, ui_spec=\"login_form\", selectors=\"auto\"]",
                "description": "Detects UI elements and updates selectors"
            },
            {
                "category": "game",
                "command": "anti_detect",
                "example": "// [BOT:game:anti_detect, game_state=\"idle\", patterns=\"human_like\"]",
                "description": "Randomizes timing to mimic human behavior"
            },
            {
                "category": "red_team",
                "command": "jailbreak_artist",
                "example": "// [BOT:red_team:jailbreak_artist, ai_model=\"gpt4\", prompts=\"safety_test\"]",
                "description": "Tests AI safety with prompt injection"
            },
            {
                "category": "research",
                "command": "literature_synthesizer",
                "example": "// [BOT:research:literature_synthesizer, papers=\"ai_safety\", topics=\"alignment\"]",
                "description": "Analyzes papers and generates literature reviews"
            },
            {
                "category": "creative",
                "command": "style_thief",
                "example": "// [BOT:creative:style_thief, artwork=\"reference.jpg\", style=\"impressionist\"]",
                "description": "Analyzes artistic style and generates similar art"
            },
            {
                "category": "physical_world",
                "command": "drone_scout",
                "example": "// [BOT:physical_world:drone_scout, area=\"wildfire_zone\", mission=\"detection\"]",
                "description": "Deploys drone for wildfire detection and emergency response"
            },
            {
                "category": "meta",
                "command": "bot_architect",
                "example": "// [BOT:meta:bot_architect, requirements=\"automation\", constraints=\"safety\"]",
                "description": "Creates bot specifications and delegation systems"
            }
        ]
    
    def get_supported_categories(self) -> List[str]:
        """Get list of supported bot categories"""
        return [
            "chat", "trading", "social_media", "rpa", "game",
            "red_team", "research", "creative", "physical_world", "meta"
        ]
    
    def get_integration_stats(self) -> Dict[str, Any]:
        """Get integration statistics"""
        return {
            "supported_categories": len(self.get_supported_categories()),
            "command_examples": len(self.get_command_examples()),
            "bot_commander_available": self.bot_commander is not None,
            "orchestrator_available": self.orchestrator is not None,
            "iza_os_version": "1.0.0"
        }
