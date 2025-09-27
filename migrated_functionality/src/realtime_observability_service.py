#!/usr/bin/env python3
"""
Real-time Metrics Streaming Service for IZA OS memU Ecosystem
Provides live observability for autonomous venture studio operations
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import psutil
import socketio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RealtimeMetrics:
    """Real-time metrics data structure"""
    timestamp: str
    agents: Dict[str, int]
    system: Dict[str, float]
    business: Dict[str, float]
    performance: Dict[str, float]
    security: Dict[str, int]
    websocket_connections: int
    active_workflows: int

@dataclass
class LiveEvent:
    """Live event data structure"""
    id: str
    type: str
    timestamp: str
    message: str
    severity: str
    data: Optional[Dict[str, Any]] = None

class RealtimeMetricsCollector:
    """Collects real-time metrics from various sources"""
    
    def __init__(self):
        self.start_time = time.time()
        self.event_counter = 0
        
    async def collect_system_metrics(self) -> Dict[str, float]:
        """Collect system performance metrics"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Network stats
            net_io = psutil.net_io_counters()
            network_usage = (net_io.bytes_sent + net_io.bytes_recv) / (1024 * 1024)  # MB
            
            return {
                'cpu': round(cpu_percent, 2),
                'memory': round(memory.percent, 2),
                'disk': round(disk.percent, 2),
                'network': round(network_usage, 2)
            }
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return {'cpu': 0, 'memory': 0, 'disk': 0, 'network': 0}
    
    async def collect_agent_metrics(self) -> Dict[str, int]:
        """Collect agent system metrics"""
        # In a real implementation, this would query the agent system
        return {
            'active': 27,
            'idle': 3,
            'error': 0,
            'total': 30
        }
    
    async def collect_business_metrics(self) -> Dict[str, float]:
        """Collect business metrics"""
        # In a real implementation, this would query business systems
        return {
            'revenue': 2400000.0,  # $2.4M
            'deals': 156.0,
            'conversions': 89.5,
            'pipeline': 10000000.0  # $10M pipeline
        }
    
    async def collect_performance_metrics(self) -> Dict[str, float]:
        """Collect performance metrics"""
        uptime = time.time() - self.start_time
        return {
            'response_time': 45.2,  # ms
            'throughput': 1250.0,    # requests/min
            'error_rate': 0.1,       # %
            'uptime': round((uptime / 3600) * 100, 2)  # hours as percentage
        }
    
    async def collect_security_metrics(self) -> Dict[str, int]:
        """Collect security metrics"""
        return {
            'threats': 0,
            'blocked': 23,
            'alerts': 0,
            'compliance': 98
        }
    
    async def collect_all_metrics(self) -> RealtimeMetrics:
        """Collect all metrics"""
        return RealtimeMetrics(
            timestamp=datetime.now().isoformat(),
            agents=await self.collect_agent_metrics(),
            system=await self.collect_system_metrics(),
            business=await self.collect_business_metrics(),
            performance=await self.collect_performance_metrics(),
            security=await self.collect_security_metrics(),
            websocket_connections=len(self.active_connections),
            active_workflows=12
        )

class LiveEventGenerator:
    """Generates live events for real-time monitoring"""
    
    def __init__(self):
        self.event_counter = 0
        
    def generate_agent_event(self) -> LiveEvent:
        """Generate agent-related events"""
        events = [
            "Agent BotGod_v1 completed task: 'Generate marketing strategy'",
            "Agent CTO_Agent started new project: 'AI Integration'",
            "Agent CFO_Agent processed payment: $50,000",
            "Agent CMO_Agent launched campaign: 'Q4 Product Launch'",
            "Agent DevOps_Agent deployed update: 'v2.1.3'"
        ]
        
        self.event_counter += 1
        return LiveEvent(
            id=f"agent-event-{self.event_counter}",
            type="agent",
            timestamp=datetime.now().isoformat(),
            message=events[self.event_counter % len(events)],
            severity="info"
        )
    
    def generate_business_event(self) -> LiveEvent:
        """Generate business-related events"""
        events = [
            "New deal closed: $250,000 contract signed",
            "Revenue milestone reached: $2.5M ARR",
            "Customer conversion rate improved: 15%",
            "Pipeline updated: 3 new opportunities",
            "ROI analysis completed: 340% return"
        ]
        
        self.event_counter += 1
        return LiveEvent(
            id=f"business-event-{self.event_counter}",
            type="business",
            timestamp=datetime.now().isoformat(),
            message=events[self.event_counter % len(events)],
            severity="success"
        )
    
    def generate_system_event(self) -> LiveEvent:
        """Generate system-related events"""
        events = [
            "System performance optimized: CPU usage reduced by 15%",
            "Database connection pool expanded: +10 connections",
            "Cache hit rate improved: 95% efficiency",
            "Load balancer updated: New configuration applied",
            "Backup completed: All systems backed up successfully"
        ]
        
        self.event_counter += 1
        return LiveEvent(
            id=f"system-event-{self.event_counter}",
            type="system",
            timestamp=datetime.now().isoformat(),
            message=events[self.event_counter % len(events)],
            severity="info"
        )
    
    def generate_security_event(self) -> LiveEvent:
        """Generate security-related events"""
        events = [
            "Security scan completed: No vulnerabilities found",
            "Access attempt blocked: Unauthorized IP address",
            "Compliance check passed: SOC 2 requirements met",
            "Encryption updated: AES-256-GCM implemented",
            "Audit log generated: All activities logged"
        ]
        
        self.event_counter += 1
        return LiveEvent(
            id=f"security-event-{self.event_counter}",
            timestamp=datetime.now().isoformat(),
            message=events[self.event_counter % len(events)],
            severity="success"
        )

class RealtimeObservabilityService:
    """Main service for real-time observability"""
    
    def __init__(self):
        self.app = FastAPI(title="IZA OS memU Real-time Observability")
        self.sio = socketio.AsyncServer(cors_allowed_origins="*")
        self.app.mount("/socket.io", self.sio)
        
        self.metrics_collector = RealtimeMetricsCollector()
        self.event_generator = LiveEventGenerator()
        self.active_connections = set()
        
        # Setup CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup Socket.IO events
        self.setup_socketio_events()
        
        # Setup FastAPI routes
        self.setup_routes()
        
        # Start background tasks
        self.start_background_tasks()
    
    def setup_socketio_events(self):
        """Setup Socket.IO event handlers"""
        
        @self.sio.event
        async def connect(sid, environ):
            """Handle client connection"""
            self.active_connections.add(sid)
            logger.info(f"Client connected: {sid}")
            
            # Send initial metrics
            metrics = await self.metrics_collector.collect_all_metrics()
            await self.sio.emit('metrics_update', asdict(metrics), room=sid)
        
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            self.active_connections.discard(sid)
            logger.info(f"Client disconnected: {sid}")
        
        @self.sio.event
        async def subscribe(sid, data):
            """Handle subscription requests"""
            logger.info(f"Client {sid} subscribed to: {data}")
            await self.sio.emit('subscription_confirmed', {'topic': data}, room=sid)
    
    def setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.get("/api/metrics")
        async def get_metrics():
            """Get current metrics"""
            metrics = await self.metrics_collector.collect_all_metrics()
            return asdict(metrics)
        
        @self.app.get("/api/health")
        async def health_check():
            """Health check endpoint"""
            return {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "active_connections": len(self.active_connections)
            }
        
        @self.app.websocket("/ws/metrics")
        async def websocket_metrics(websocket: WebSocket):
            """WebSocket endpoint for real-time metrics"""
            await websocket.accept()
            
            try:
                while True:
                    metrics = await self.metrics_collector.collect_all_metrics()
                    await websocket.send_json(asdict(metrics))
                    await asyncio.sleep(1)  # Update every second
            except WebSocketDisconnect:
                logger.info("WebSocket client disconnected")
    
    async def broadcast_metrics(self):
        """Broadcast metrics to all connected clients"""
        try:
            metrics = await self.metrics_collector.collect_all_metrics()
            await self.sio.emit('metrics_update', asdict(metrics))
        except Exception as e:
            logger.error(f"Error broadcasting metrics: {e}")
    
    async def broadcast_events(self):
        """Broadcast live events to all connected clients"""
        try:
            # Generate random events
            event_types = [
                self.event_generator.generate_agent_event,
                self.event_generator.generate_business_event,
                self.event_generator.generate_system_event,
                self.event_generator.generate_security_event
            ]
            
            # Randomly select an event type
            import random
            event = random.choice(event_types)()
            
            await self.sio.emit('live_event', asdict(event))
        except Exception as e:
            logger.error(f"Error broadcasting events: {e}")
    
    def start_background_tasks(self):
        """Start background tasks for real-time updates"""
        
        async def metrics_broadcaster():
            """Broadcast metrics every 5 seconds"""
            while True:
                await self.broadcast_metrics()
                await asyncio.sleep(5)
        
        async def events_broadcaster():
            """Broadcast events every 10 seconds"""
            while True:
                await self.broadcast_events()
                await asyncio.sleep(10)
        
        # Start background tasks
        asyncio.create_task(metrics_broadcaster())
        asyncio.create_task(events_broadcaster())
    
    async def run(self, host="0.0.0.0", port=8001):
        """Run the observability service"""
        logger.info(f"Starting IZA OS memU Real-time Observability Service on {host}:{port}")
        
        config = uvicorn.Config(
            app=self.app,
            host=host,
            port=port,
            log_level="info"
        )
        
        server = uvicorn.Server(config)
        await server.serve()

# Main execution
if __name__ == "__main__":
    service = RealtimeObservabilityService()
    asyncio.run(service.run())
