"""
Universal Bot Command Engine

Manages 100+ elite commands across 10 specialized bot categories with
comprehensive orchestration, compliance validation, and performance monitoring.

This module provides the core BotCommander class that serves as the central
command and control system for all bot operations in the IZA OS ecosystem.
"""

import asyncio
import logging
import time
import uuid
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import json

from ..memory.manager import MemoryManager
from ..governance.IZA_OS_COMPLIANCE import ComplianceManager
from ..monitoring.IZA_OS_METRICS import MetricsCollector
from ..orchestration.controller import OrchestrationController


class BotCategory(Enum):
    """Bot categories for command classification"""
    CHATBOTS = "chatbots"
    TRADING_BOTS = "trading_bots"
    SOCIAL_MEDIA_BOTS = "social_media_bots"
    RPA_BOTS = "rpa_bots"
    GAME_BOTS = "game_bots"
    RED_TEAM_BOTS = "red_team_bots"
    RESEARCH_BOTS = "research_bots"
    CREATIVE_BOTS = "creative_bots"
    PHYSICAL_WORLD_BOTS = "physical_world_bots"
    META_BOTS = "meta_bots"


@dataclass
class BotCommand:
    """Represents a bot command with metadata"""
    command_id: str
    category: BotCategory
    name: str
    description: str
    parameters: Dict[str, Any]
    compliance_requirements: List[str]
    execution_timeout: int
    retry_policy: Dict[str, Any]
    safety_constraints: List[str]


@dataclass
class CommandExecution:
    """Represents a command execution instance"""
    execution_id: str
    command: BotCommand
    parameters: Dict[str, Any]
    status: str
    start_time: float
    end_time: Optional[float]
    result: Optional[Any]
    error: Optional[str]
    compliance_status: str
    performance_metrics: Dict[str, Any]


class BotCommander:
    """
    Universal Bot Command Engine
    
    Manages 100+ elite commands across 10 bot categories with comprehensive
    orchestration, compliance validation, and performance monitoring.
    """
    
    def __init__(self, 
                 memory_manager: MemoryManager,
                 compliance_manager: ComplianceManager,
                 metrics_collector: MetricsCollector,
                 orchestration_controller: OrchestrationController):
        """
        Initialize BotCommander with required dependencies
        
        Args:
            memory_manager: Memory management system
            compliance_manager: Compliance validation system
            metrics_collector: Performance metrics collection
            orchestration_controller: Core orchestration system
        """
        self.memory_manager = memory_manager
        self.compliance_manager = compliance_manager
        self.metrics_collector = metrics_collector
        self.orchestration_controller = orchestration_controller
        
        self.logger = logging.getLogger(__name__)
        self.command_registry: Dict[str, BotCommand] = {}
        self.active_executions: Dict[str, CommandExecution] = {}
        self.bot_categories: Dict[BotCategory, Any] = {}
        
        # Initialize bot category handlers
        self._initialize_bot_categories()
        
        # Register all bot commands
        self._register_bot_commands()
        
        self.logger.info("BotCommander initialized with 100+ elite commands across 10 categories")
    
    def _initialize_bot_categories(self):
        """Initialize bot category handlers"""
        try:
            from .chatbot_commands import ChatbotCommands
            from .trading_bot_commands import TradingBotCommands
            from .social_media_bot_commands import SocialMediaBotCommands
            from .rpa_bot_commands import RPABotCommands
            from .game_bot_commands import GameBotCommands
            from .red_team_bot_commands import RedTeamBotCommands
            from .research_bot_commands import ResearchBotCommands
            from .creative_bot_commands import CreativeBotCommands
            from .physical_world_bot_commands import PhysicalWorldBotCommands
            from .meta_bot_commands import MetaBotCommands
            
            self.bot_categories = {
                BotCategory.CHATBOTS: ChatbotCommands(self.memory_manager, self.compliance_manager),
                BotCategory.TRADING_BOTS: TradingBotCommands(self.memory_manager, self.compliance_manager),
                BotCategory.SOCIAL_MEDIA_BOTS: SocialMediaBotCommands(self.compliance_manager, self.metrics_collector),
                BotCategory.RPA_BOTS: RPABotCommands(self.memory_manager, self.compliance_manager),
                BotCategory.GAME_BOTS: GameBotCommands(self.memory_manager, self.compliance_manager),
                BotCategory.RED_TEAM_BOTS: RedTeamBotCommands(self.compliance_manager, self.compliance_manager),
                BotCategory.RESEARCH_BOTS: ResearchBotCommands(self.memory_manager, self.compliance_manager),
                BotCategory.CREATIVE_BOTS: CreativeBotCommands(self.compliance_manager, self.memory_manager),
                BotCategory.PHYSICAL_WORLD_BOTS: PhysicalWorldBotCommands(self.metrics_collector, self.compliance_manager),
                BotCategory.META_BOTS: MetaBotCommands(self.orchestration_controller, self.compliance_manager)
            }
            
            self.logger.info(f"Initialized {len(self.bot_categories)} bot category handlers")
            
        except ImportError as e:
            self.logger.warning(f"Some bot category handlers not available: {e}")
            # Initialize with placeholder handlers for missing categories
            for category in BotCategory:
                if category not in self.bot_categories:
                    self.bot_categories[category] = None
    
    def _register_bot_commands(self):
        """Register all 100+ elite bot commands"""
        # Chatbot Commands (10+ commands)
        chatbot_commands = [
            ("empathy_engine", "Empathy Engine", "Detects frustration, escalates to human", 
             ["user_input", "context"], ["PII_protection", "medical_advice"], 30),
            ("memory_guardian", "Memory Guardian", "Remembers user preferences, recalls on return",
             ["user_id", "preferences"], ["data_retention"], 15),
            ("compliance_firewall", "Compliance Firewall", "Scans for PII, medical advice, redacts",
             ["message", "platform"], ["GDPR", "HIPAA"], 10),
            ("upsell_whisperer", "Upsell Whisperer", "Contextual offers, conversion tracking",
             ["user_profile", "context"], ["marketing_compliance"], 20),
            ("tone_shifter", "Tone Shifter", "Matches user communication style",
             ["user_history", "message"], ["content_moderation"], 15),
            ("multilingual_agent", "Multilingual Agent", "Language detection, routing",
             ["text", "target_language"], ["translation_accuracy"], 25),
            ("feedback_loop", "Feedback Loop", "Rating system, continuous improvement",
             ["interaction_id", "rating"], ["feedback_privacy"], 10),
            ("knowledge_synthesizer", "Knowledge Synthesizer", "FAQ generation from chat history",
             ["chat_history"], ["data_anonymization"], 45),
            ("proactive_care", "Proactive Care", "Reactivation campaigns",
             ["user_segments"], ["marketing_consent"], 30),
            ("whisper_network", "Whisper Network", "Bug detection, auto-alerting",
             ["system_logs"], ["security_monitoring"], 20)
        ]
        
        # Trading Bot Commands (10+ commands)
        trading_commands = [
            ("risk_warden", "Risk Warden", "Auto-sell on drawdown, stablecoin protection",
             ["portfolio", "risk_threshold"], ["financial_regulation"], 60),
            ("regulation_guardian", "Regulation Guardian", "Insider trading detection, compliance blocking",
             ["trades", "regulations"], ["SEC_compliance"], 30),
            ("slippage_sniper", "Slippage Sniper", "DEX optimization, liquidity waiting",
             ["trade_params", "liquidity"], ["market_manipulation"], 45),
            ("tax_optimizer", "Tax Optimizer", "Loss harvesting, year-end reporting",
             ["transactions", "tax_year"], ["tax_compliance"], 90),
            ("flash_crash_detector", "Flash Crash Detector", "Volatility protection, stable moves",
             ["market_data", "thresholds"], ["market_stability"], 30),
            ("mev_defender", "MEV Defender", "Frontrunning protection, private RPC",
             ["transaction", "network"], ["MEV_protection"], 15),
            ("yield_farmer", "Yield Farmer", "Auto-compounding, pool optimization",
             ["positions", "strategies"], ["yield_optimization"], 120),
            ("black_swan_prepper", "Black Swan Prepper", "VIX monitoring, protective puts",
             ["market_indicators"], ["risk_management"], 60),
            ("wash_trade_hunter", "Wash Trade Hunter", "Self-trade detection, tax compliance",
             ["trade_history"], ["wash_trade_detection"], 45),
            ("cefi_bridge", "CeFi Bridge", "Exchange halt protection, self-custody moves",
             ["exchanges", "thresholds"], ["custody_protection"], 30)
        ]
        
        # Social Media Bot Commands (10+ commands)
        social_commands = [
            ("shadowban_avoider", "Shadowban Avoider", "Engagement monitoring, posting pauses",
             ["account", "platform"], ["platform_tos"], 30),
            ("viral_alchemist", "Viral Alchemist", "Viral post analysis, variant generation",
             ["content", "platform"], ["content_guidelines"], 60),
            ("comment_moderator", "Comment Moderator", "Spam detection, auto-moderation",
             ["comments", "rules"], ["content_moderation"], 20),
            ("trend_surfer", "Trend Surfer", "Hashtag discovery, content generation",
             ["platform", "niche"], ["trend_analysis"], 45),
            ("follower_authenticator", "Follower Authenticator", "Bot detection, account verification",
             ["followers"], ["authenticity"], 30),
            ("ugc_amplifier", "UGC Amplifier", "User content discovery, repost automation",
             ["content", "criteria"], ["content_rights"], 25),
            ("crisis_comms_bot", "Crisis Comms Bot", "Negative sentiment response, PR automation",
             ["sentiment", "response"], ["crisis_management"], 15),
            ("influencer_scout", "Influencer Scout", "Micro-influencer discovery, outreach automation",
             ["criteria", "platform"], ["outreach_compliance"], 60),
            ("cross_poster", "Cross-Poster", "Platform adaptation, multi-channel posting",
             ["content", "platforms"], ["cross_platform"], 30),
            ("copyright_sentinel", "Copyright Sentinel", "Content scanning, royalty management",
             ["content", "rights"], ["copyright_compliance"], 45)
        ]
        
        # RPA Bot Commands (10+ commands)
        rpa_commands = [
            ("element_hunter", "Element Hunter", "UI element detection, selector updating",
             ["ui_spec", "selectors"], ["ui_automation"], 30),
            ("data_guardian", "Data Guardian", "PII redaction, GDPR compliance",
             ["data", "rules"], ["GDPR_compliance"], 20),
            ("flow_healer", "Flow Healer", "Auto-retry, debug bot spawning",
             ["failed_step", "context"], ["error_recovery"], 45),
            ("human_escalator", "Human Escalator", "Ambiguity detection, human handoff",
             ["decision_point", "context"], ["human_escalation"], 15),
            ("performance_optimizer", "Performance Optimizer", "Speed measurement, flow simplification",
             ["flow_metrics"], ["performance"], 60),
            ("change_detector", "Change Detector", "UI change monitoring, selector updates",
             ["ui_elements"], ["change_detection"], 30),
            ("compliance_auditor", "Compliance Auditor", "Action logging, SOC2 compliance",
             ["actions", "audit_rules"], ["SOC2_compliance"], 25),
            ("cost_cutter", "Cost Cutter", "License optimization, flow analysis",
             ["licenses", "usage"], ["cost_optimization"], 40),
            ("bot_school", "Bot School", "Human task recording, flow generation",
             ["task_recording"], ["task_automation"], 90),
            ("disaster_recovery", "Disaster Recovery", "Server failover, backup switching",
             ["infrastructure"], ["disaster_recovery"], 30)
        ]
        
        # Game Bot Commands (10+ commands)
        game_commands = [
            ("anti_detect", "Anti-Detect", "Timing randomization, human mimicking",
             ["game_state", "patterns"], ["anti_detection"], 20),
            ("meta_learner", "Meta Learner", "Pro replay analysis, strategy extraction",
             ["replays", "strategies"], ["strategy_analysis"], 120),
            ("loot_optimizer", "Loot Optimizer", "Auction house trading, profit tracking",
             ["market_data", "inventory"], ["trading_optimization"], 60),
            ("speedrun_coach", "Speedrun Coach", "Run analysis, route optimization",
             ["run_data", "routes"], ["speedrun_optimization"], 90),
            ("toxicity_shield", "Toxicity Shield", "Auto-muting, report automation",
             ["chat_logs", "rules"], ["toxicity_moderation"], 15),
            ("event_farmer", "Event Farmer", "Double XP optimization, reward grinding",
             ["events", "objectives"], ["event_optimization"], 45),
            ("streamer_assistant", "Streamer Assistant", "Highlight detection, clip automation",
             ["stream_data"], ["content_creation"], 30),
            ("economy_balancer", "Economy Balancer", "Currency trading, wealth stabilization",
             ["economy_data"], ["economy_management"], 75),
            ("guild_manager", "Guild Manager", "Player recruitment, role assignment",
             ["guild_data", "players"], ["guild_management"], 40),
            ("bug_reporter", "Bug Reporter", "Crash detection, dev reporting",
             ["game_logs"], ["bug_reporting"], 25)
        ]
        
        # Red Team Bot Commands (10+ commands)
        red_team_commands = [
            ("jailbreak_artist", "Jailbreak Artist", "Prompt injection testing, AI safety",
             ["ai_model", "prompts"], ["ai_safety"], 30),
            ("data_leak_hunter", "Data Leak Hunter", "PII detection, output scanning",
             ["outputs", "patterns"], ["data_protection"], 20),
            ("phishing_sim", "Phishing Sim", "Security awareness training, click tracking",
             ["campaign", "targets"], ["security_training"], 45),
            ("api_fuzzer", "API Fuzzer", "Endpoint testing, vulnerability discovery",
             ["endpoints", "payloads"], ["api_security"], 60),
            ("token_thief", "Token Thief", "Credential extraction, security hardening",
             ["applications"], ["credential_security"], 30),
            ("ransomware_sim", "Ransomware Sim", "Encryption testing, response training",
             ["test_environment"], ["incident_response"], 90),
            ("social_engineer", "Social Engineer", "Helpdesk testing, staff training",
             ["targets", "scenarios"], ["social_engineering"], 60),
            ("zero_day_hunter", "Zero-Day Hunter", "Exploit discovery, vendor alerting",
             ["software", "versions"], ["vulnerability_research"], 120),
            ("insider_threat_sim", "Insider Threat Sim", "Data exfiltration testing, DLP validation",
             ["data_access"], ["insider_threat"], 45),
            ("tabletop_warrior", "Tabletop Warrior", "Breach scenario generation, response scoring",
             ["scenarios", "teams"], ["incident_response"], 90)
        ]
        
        # Research Bot Commands (10+ commands)
        research_commands = [
            ("literature_synthesizer", "Literature Synthesizer", "Paper analysis, review generation",
             ["papers", "topics"], ["academic_integrity"], 120),
            ("peer_review_bot", "Peer Review Bot", "Automated review generation, scoring",
             ["manuscript", "criteria"], ["peer_review"], 180),
            ("grant_hunter", "Grant Hunter", "Funding opportunity discovery, application automation",
             ["research_area", "criteria"], ["grant_compliance"], 90),
            ("data_miner", "Data Miner", "Dataset discovery, analysis reproduction",
             ["research_question"], ["data_reproducibility"], 60),
            ("citation_guardian", "Citation Guardian", "Reference validation, retraction detection",
             ["references"], ["citation_integrity"], 30),
            ("bias_detector", "Bias Detector", "Methodology analysis, diversity flagging",
             ["research_methods"], ["research_ethics"], 45),
            ("preprint_promoter", "Preprint Promoter", "Social media promotion, journal matching",
             ["preprint"], ["academic_promotion"], 30),
            ("lab_automator", "Lab Automator", "Protocol automation, robot integration",
             ["protocols", "equipment"], ["lab_automation"], 120),
            ("clinical_trial_matcher", "Clinical Trial Matcher", "Patient matching, trial discovery",
             ["patient_data", "criteria"], ["clinical_compliance"], 60),
            ("patent_scout", "Patent Scout", "Prior art searching, IP protection",
             ["invention", "jurisdiction"], ["ip_protection"], 90)
        ]
        
        # Creative Bot Commands (10+ commands)
        creative_commands = [
            ("style_thief", "Style Thief", "Artistic style analysis, generation",
             ["artwork", "style"], ["artistic_style"], 60),
            ("copyright_guardian", "Copyright Guardian", "Similarity detection, rights management",
             ["content", "rights"], ["copyright_compliance"], 30),
            ("hit_predictor", "Hit Predictor", "Music analysis, success prediction",
             ["music", "market"], ["music_analysis"], 45),
            ("script_doctor", "Script Doctor", "Screenplay analysis, improvement",
             ["script", "criteria"], ["script_analysis"], 90),
            ("fashion_designer", "Fashion Designer", "Trend analysis, design generation",
             ["trends", "constraints"], ["fashion_design"], 60),
            ("architecture_bot", "Architecture Bot", "3D modeling, energy optimization",
             ["design", "requirements"], ["architectural_design"], 120),
            ("poetry_slam_bot", "Poetry Slam Bot", "Verse generation, performance scoring",
             ["theme", "style"], ["poetry_generation"], 30),
            ("ad_composer", "Ad Composer", "Campaign generation, A/B testing",
             ["product", "audience"], ["ad_creation"], 45),
            ("game_designer", "Game Designer", "Mechanics generation, balance testing",
             ["game_concept"], ["game_design"], 90),
            ("deepfake_defender", "Deepfake Defender", "Likeness protection, takedown automation",
             ["content", "rights"], ["deepfake_protection"], 30)
        ]
        
        # Physical World Bot Commands (10+ commands)
        physical_commands = [
            ("drone_scout", "Drone Scout", "Wildfire detection, emergency response",
             ["area", "mission"], ["drone_regulations"], 60),
            ("robot_butler", "Robot Butler", "Household automation, task completion",
             ["tasks", "environment"], ["home_automation"], 45),
            ("farm_bot", "Farm Bot", "Agricultural automation, yield optimization",
             ["crops", "conditions"], ["agricultural_automation"], 120),
            ("traffic_optimizer", "Traffic Optimizer", "Congestion management, flow improvement",
             ["traffic_data"], ["traffic_management"], 30),
            ("warehouse_picker", "Warehouse Picker", "Inventory automation, order fulfillment",
             ["orders", "inventory"], ["warehouse_automation"], 60),
            ("surgery_assistant", "Surgery Assistant", "Medical tool management, safety monitoring",
             ["procedure", "tools"], ["medical_safety"], 90),
            ("disaster_responder", "Disaster Responder", "Emergency deployment, rescue coordination",
             ["disaster_type", "resources"], ["emergency_response"], 30),
            ("retail_restocker", "Retail Restocker", "Inventory management, shelf monitoring",
             ["inventory", "store_layout"], ["retail_automation"], 45),
            ("energy_saver", "Energy Saver", "Building automation, consumption optimization",
             ["building_data"], ["energy_optimization"], 60),
            ("elder_care_bot", "Elder Care Bot", "Fall detection, emergency response",
             ["patient_data"], ["elder_care"], 30)
        ]
        
        # Meta Bot Commands (10+ commands)
        meta_commands = [
            ("bot_architect", "Bot Architect", "Bot specification, delegation system",
             ["requirements", "constraints"], ["bot_creation"], 120),
            ("bot_school", "Bot School", "Training system, performance evaluation",
             ["training_data", "metrics"], ["bot_training"], 180),
            ("bot_gene_pool", "Bot Gene Pool", "Evolutionary optimization, performance breeding",
             ["bot_population"], ["evolutionary_optimization"], 240),
            ("bot_economy", "Bot Economy", "Token system, resource allocation",
             ["resources", "allocation"], ["resource_management"], 60),
            ("bot_constitution", "Bot Constitution", "Safety constraints, shutdown protocols",
             ["safety_rules"], ["safety_management"], 30),
            ("bot_therapist", "Bot Therapist", "Wellness monitoring, performance optimization",
             ["bot_metrics"], ["bot_wellness"], 45),
            ("bot_historian", "Bot Historian", "Action logging, lesson learning",
             ["bot_history"], ["historical_analysis"], 60),
            ("bot_red_team", "Bot Red Team", "Security testing, vulnerability assessment",
             ["bot_systems"], ["bot_security"], 90),
            ("bot_god", "Bot God", "Hierarchical management, executive delegation",
             ["bot_hierarchy"], ["bot_management"], 120),
            ("bot_singularity", "Bot Singularity", "Version evolution, self-upgrading",
             ["current_version"], ["self_improvement"], 300)
        ]
        
        # Register all commands
        all_commands = [
            (BotCategory.CHATBOTS, chatbot_commands),
            (BotCategory.TRADING_BOTS, trading_commands),
            (BotCategory.SOCIAL_MEDIA_BOTS, social_commands),
            (BotCategory.RPA_BOTS, rpa_commands),
            (BotCategory.GAME_BOTS, game_commands),
            (BotCategory.RED_TEAM_BOTS, red_team_commands),
            (BotCategory.RESEARCH_BOTS, research_commands),
            (BotCategory.CREATIVE_BOTS, creative_commands),
            (BotCategory.PHYSICAL_WORLD_BOTS, physical_commands),
            (BotCategory.META_BOTS, meta_commands)
        ]
        
        for category, commands in all_commands:
            for command_data in commands:
                command_id, name, description, parameters, compliance_requirements, timeout = command_data
                command = BotCommand(
                    command_id=command_id,
                    category=category,
                    name=name,
                    description=description,
                    parameters=parameters,
                    compliance_requirements=compliance_requirements,
                    execution_timeout=timeout,
                    retry_policy={"max_retries": 3, "backoff_factor": 2},
                    safety_constraints=["human_oversight", "audit_trail", "rollback_capability"]
                )
                self.command_registry[f"{category.value}:{command_id}"] = command
        
        self.logger.info(f"Registered {len(self.command_registry)} elite bot commands")
    
    async def execute_command(self, 
                            category: str, 
                            command_id: str, 
                            parameters: Dict[str, Any],
                            execution_context: Optional[Dict[str, Any]] = None) -> CommandExecution:
        """
        Execute a bot command with comprehensive orchestration
        
        Args:
            category: Bot category (e.g., 'chatbots', 'trading_bots')
            command_id: Specific command identifier
            parameters: Command parameters
            execution_context: Additional execution context
            
        Returns:
            CommandExecution: Execution result with metadata
        """
        try:
            # Generate execution ID
            execution_id = str(uuid.uuid4())
            
            # Get command from registry
            command_key = f"{category}:{command_id}"
            if command_key not in self.command_registry:
                raise ValueError(f"Command not found: {command_key}")
            
            command = self.command_registry[command_key]
            
            # Create execution instance
            execution = CommandExecution(
                execution_id=execution_id,
                command=command,
                parameters=parameters,
                status="pending",
                start_time=time.time(),
                end_time=None,
                result=None,
                error=None,
                compliance_status="pending",
                performance_metrics={}
            )
            
            # Store active execution
            self.active_executions[execution_id] = execution
            
            # Validate compliance
            compliance_result = await self.validate_compliance(command, parameters)
            execution.compliance_status = compliance_result["status"]
            
            if compliance_result["status"] != "approved":
                execution.status = "failed"
                execution.error = f"Compliance validation failed: {compliance_result['reason']}"
                execution.end_time = time.time()
                return execution
            
            # Execute command
            execution.status = "running"
            start_time = time.time()
            
            try:
                # Get category handler
                bot_category = BotCategory(category)
                handler = self.bot_categories.get(bot_category)
                
                if handler is None:
                    raise ValueError(f"No handler available for category: {category}")
                
                # Execute command through category handler
                result = await handler.execute_command(command_id, parameters, execution_context)
                
                execution.result = result
                execution.status = "completed"
                
            except Exception as e:
                execution.status = "failed"
                execution.error = str(e)
                self.logger.error(f"Command execution failed: {e}")
            
            finally:
                execution.end_time = time.time()
                execution.performance_metrics = {
                    "execution_time": execution.end_time - execution.start_time,
                    "memory_usage": self._get_memory_usage(),
                    "cpu_usage": self._get_cpu_usage()
                }
                
                # Record metrics
                await self.metrics_collector.record_command_execution(execution)
                
                # Store execution history
                await self.memory_manager.store_command_execution(execution)
            
            return execution
            
        except Exception as e:
            self.logger.error(f"Command execution error: {e}")
            raise
    
    async def validate_compliance(self, command: BotCommand, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate command compliance with regulations and safety constraints
        
        Args:
            command: Bot command to validate
            parameters: Command parameters
            
        Returns:
            Dict with compliance status and details
        """
        try:
            # Check compliance requirements
            compliance_result = await self.compliance_manager.validate_command(
                command.compliance_requirements,
                parameters
            )
            
            # Check safety constraints
            safety_result = await self._validate_safety_constraints(command, parameters)
            
            if not safety_result["approved"]:
                return {
                    "status": "rejected",
                    "reason": f"Safety constraint violation: {safety_result['reason']}",
                    "details": safety_result
                }
            
            return {
                "status": "approved" if compliance_result["approved"] else "rejected",
                "reason": compliance_result.get("reason", "Compliance validation passed"),
                "details": compliance_result
            }
            
        except Exception as e:
            self.logger.error(f"Compliance validation error: {e}")
            return {
                "status": "error",
                "reason": f"Compliance validation failed: {str(e)}",
                "details": {"error": str(e)}
            }
    
    async def _validate_safety_constraints(self, command: BotCommand, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Validate safety constraints for command execution"""
        try:
            # Check for human oversight requirement
            if "human_oversight" in command.safety_constraints:
                if not parameters.get("human_approval"):
                    return {
                        "approved": False,
                        "reason": "Human oversight required but not provided"
                    }
            
            # Check for audit trail requirement
            if "audit_trail" in command.safety_constraints:
                if not parameters.get("audit_enabled", True):
                    return {
                        "approved": False,
                        "reason": "Audit trail required but disabled"
                    }
            
            # Check for rollback capability
            if "rollback_capability" in command.safety_constraints:
                if not parameters.get("rollback_enabled", True):
                    return {
                        "approved": False,
                        "reason": "Rollback capability required but disabled"
                    }
            
            return {"approved": True, "reason": "All safety constraints satisfied"}
            
        except Exception as e:
            return {
                "approved": False,
                "reason": f"Safety validation error: {str(e)}"
            }
    
    def get_bot_categories(self) -> List[Dict[str, Any]]:
        """Get list of all bot categories with metadata"""
        categories = []
        for category in BotCategory:
            handler = self.bot_categories.get(category)
            categories.append({
                "category": category.value,
                "name": category.value.replace("_", " ").title(),
                "handler_available": handler is not None,
                "command_count": len([cmd for cmd in self.command_registry.values() 
                                    if cmd.category == category])
            })
        return categories
    
    def list_bot_commands(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all bot commands, optionally filtered by category
        
        Args:
            category: Optional category filter
            
        Returns:
            List of command metadata
        """
        commands = []
        for command_key, command in self.command_registry.items():
            if category is None or command.category.value == category:
                commands.append({
                    "command_id": command.command_id,
                    "category": command.category.value,
                    "name": command.name,
                    "description": command.description,
                    "parameters": command.parameters,
                    "compliance_requirements": command.compliance_requirements,
                    "execution_timeout": command.execution_timeout,
                    "safety_constraints": command.safety_constraints
                })
        return commands
    
    def get_execution_status(self, execution_id: str) -> Optional[CommandExecution]:
        """Get status of a command execution"""
        return self.active_executions.get(execution_id)
    
    def get_active_executions(self) -> List[CommandExecution]:
        """Get all active command executions"""
        return list(self.active_executions.values())
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage percentage"""
        try:
            import psutil
            return psutil.virtual_memory().percent
        except ImportError:
            return 0.0
    
    def _get_cpu_usage(self) -> float:
        """Get current CPU usage percentage"""
        try:
            import psutil
            return psutil.cpu_percent()
        except ImportError:
            return 0.0
    
    async def shutdown(self):
        """Gracefully shutdown BotCommander"""
        try:
            # Cancel all active executions
            for execution in self.active_executions.values():
                if execution.status == "running":
                    execution.status = "cancelled"
                    execution.end_time = time.time()
            
            # Clear active executions
            self.active_executions.clear()
            
            self.logger.info("BotCommander shutdown completed")
            
        except Exception as e:
            self.logger.error(f"Error during BotCommander shutdown: {e}")
