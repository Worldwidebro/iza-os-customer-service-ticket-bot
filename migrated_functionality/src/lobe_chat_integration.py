#!/usr/bin/env python3
"""
IZA OS Lobe Chat Integration
Phase 1: Quick Wins - Enhanced Conversational Interfaces

This module implements Lobe Chat integration following enterprise-grade standards:
- 90%+ test coverage required
- Security-first development
- McKinsey 7S framework alignment
- Billion-dollar scale architecture
"""

import asyncio
import logging
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import uuid

# Enterprise libraries
import requests
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, ValidationError, Field
import redis
from sqlalchemy import create_engine, Column, String, DateTime, JSON, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Monitoring and observability
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import structlog

# Security
from cryptography.fernet import Fernet
import jwt

# Configuration
import yaml
import os
from pathlib import Path

# Async processing
import aiohttp
import aioredis

class ChatProvider(Enum):
    """Supported chat providers"""
    LOBE_CHAT = "lobe_chat"
    CLAUDE = "claude"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"

class MessageType(Enum):
    """Message types for chat system"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    ERROR = "error"

@dataclass
class ChatMessage:
    """Chat message data structure"""
    id: str
    user_id: str
    conversation_id: str
    message_type: MessageType
    content: str
    timestamp: datetime
    metadata: Dict[str, Any]
    provider: ChatProvider
    response_time_ms: Optional[int] = None
    token_count: Optional[int] = None
    cost: Optional[float] = None

@dataclass
class ChatSession:
    """Chat session data structure"""
    id: str
    user_id: str
    session_name: str
    created_at: datetime
    last_activity: datetime
    message_count: int
    total_tokens: int
    total_cost: float
    metadata: Dict[str, Any]

class ChatConfig:
    """Configuration for chat integration"""
    
    def __init__(self, config_path: str = "config/chat_config.yaml"):
        self.config_path = config_path
        self._load_config()
    
    def _load_config(self):
        """Load configuration from YAML file"""
        try:
            with open(self.config_path, 'r') as file:
                config = yaml.safe_load(file)
                
            self.lobe_chat = config.get('lobe_chat', {})
            self.claude = config.get('claude', {})
            self.openai = config.get('openai', {})
            self.redis_config = config.get('redis', {})
            self.database_config = config.get('database', {})
            self.security_config = config.get('security', {})
            
        except FileNotFoundError:
            # Create default configuration
            self._create_default_config()
    
    def _create_default_config(self):
        """Create default configuration"""
        default_config = {
            'lobe_chat': {
                'api_url': 'https://api.lobe.chat/v1',
                'api_key': os.getenv('LOBE_CHAT_API_KEY', ''),
                'model': 'lobe-chat',
                'max_tokens': 4000,
                'temperature': 0.7
            },
            'claude': {
                'api_key': os.getenv('CLAUDE_API_KEY', ''),
                'model': 'claude-3-sonnet-20240229',
                'max_tokens': 4000
            },
            'openai': {
                'api_key': os.getenv('OPENAI_API_KEY', ''),
                'model': 'gpt-4',
                'max_tokens': 4000
            },
            'redis': {
                'host': 'localhost',
                'port': 6379,
                'db': 0,
                'password': os.getenv('REDIS_PASSWORD', '')
            },
            'database': {
                'url': 'postgresql://user:pass@localhost/iza_os_chat',
                'pool_size': 20,
                'max_overflow': 30
            },
            'security': {
                'jwt_secret': os.getenv('JWT_SECRET', 'your-secret-key'),
                'jwt_algorithm': 'HS256',
                'jwt_expiry_hours': 24
            }
        }
        
        # Ensure config directory exists
        os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
        
        with open(self.config_path, 'w') as file:
            yaml.dump(default_config, file, default_flow_style=False)
        
        # Reload config
        self._load_config()

class ChatSecurity:
    """Security management for chat system"""
    
    def __init__(self, config: ChatConfig):
        self.config = config
        self.jwt_secret = config.security_config['jwt_secret']
        self.jwt_algorithm = config.security_config['jwt_algorithm']
        self.jwt_expiry_hours = config.security_config['jwt_expiry_hours']
    
    def generate_jwt_token(self, user_id: str, permissions: List[str]) -> str:
        """Generate JWT token for user"""
        payload = {
            'user_id': user_id,
            'permissions': permissions,
            'exp': datetime.utcnow() + timedelta(hours=self.jwt_expiry_hours),
            'iat': datetime.utcnow()
        }
        
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    def hash_content(self, content: str) -> str:
        """Hash content for security"""
        return hashlib.sha256(content.encode()).hexdigest()

class ChatDatabase:
    """Database operations for chat system"""
    
    def __init__(self, config: ChatConfig):
        self.config = config
        self.engine = create_engine(
            config.database_config['url'],
            pool_size=config.database_config['pool_size'],
            max_overflow=config.database_config['max_overflow']
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.Base = declarative_base()
        self._create_tables()
    
    def _create_tables(self):
        """Create database tables"""
        class ChatMessageModel(self.Base):
            __tablename__ = "chat_messages"
            
            id = Column(String, primary_key=True)
            user_id = Column(String, nullable=False)
            conversation_id = Column(String, nullable=False)
            message_type = Column(String, nullable=False)
            content = Column(String, nullable=False)
            timestamp = Column(DateTime, nullable=False)
            metadata = Column(JSON)
            provider = Column(String, nullable=False)
            response_time_ms = Column(Integer)
            token_count = Column(Integer)
            cost = Column(String)
        
        class ChatSessionModel(self.Base):
            __tablename__ = "chat_sessions"
            
            id = Column(String, primary_key=True)
            user_id = Column(String, nullable=False)
            session_name = Column(String, nullable=False)
            created_at = Column(DateTime, nullable=False)
            last_activity = Column(DateTime, nullable=False)
            message_count = Column(Integer, default=0)
            total_tokens = Column(Integer, default=0)
            total_cost = Column(String, default="0.0")
            metadata = Column(JSON)
        
        self.ChatMessageModel = ChatMessageModel
        self.ChatSessionModel = ChatSessionModel
        
        # Create tables
        self.Base.metadata.create_all(bind=self.engine)
    
    def save_message(self, message: ChatMessage):
        """Save chat message to database"""
        db = self.SessionLocal()
        try:
            db_message = self.ChatMessageModel(
                id=message.id,
                user_id=message.user_id,
                conversation_id=message.conversation_id,
                message_type=message.message_type.value,
                content=message.content,
                timestamp=message.timestamp,
                metadata=message.metadata,
                provider=message.provider.value,
                response_time_ms=message.response_time_ms,
                token_count=message.token_count,
                cost=str(message.cost) if message.cost else None
            )
            db.add(db_message)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def save_session(self, session: ChatSession):
        """Save chat session to database"""
        db = self.SessionLocal()
        try:
            db_session = self.ChatSessionModel(
                id=session.id,
                user_id=session.user_id,
                session_name=session.session_name,
                created_at=session.created_at,
                last_activity=session.last_activity,
                message_count=session.message_count,
                total_tokens=session.total_tokens,
                total_cost=str(session.total_cost),
                metadata=session.metadata
            )
            db.add(db_session)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def get_conversation_history(self, conversation_id: str, limit: int = 50) -> List[ChatMessage]:
        """Get conversation history"""
        db = self.SessionLocal()
        try:
            messages = db.query(self.ChatMessageModel)\
                .filter(self.ChatMessageModel.conversation_id == conversation_id)\
                .order_by(self.ChatMessageModel.timestamp.desc())\
                .limit(limit).all()
            
            return [
                ChatMessage(
                    id=msg.id,
                    user_id=msg.user_id,
                    conversation_id=msg.conversation_id,
                    message_type=MessageType(msg.message_type),
                    content=msg.content,
                    timestamp=msg.timestamp,
                    metadata=msg.metadata or {},
                    provider=ChatProvider(msg.provider),
                    response_time_ms=msg.response_time_ms,
                    token_count=msg.token_count,
                    cost=float(msg.cost) if msg.cost else None
                )
                for msg in messages
            ]
        finally:
            db.close()

class ChatCache:
    """Redis cache for chat system"""
    
    def __init__(self, config: ChatConfig):
        self.config = config
        self.redis_client = redis.Redis(
            host=config.redis_config['host'],
            port=config.redis_config['port'],
            db=config.redis_config['db'],
            password=config.redis_config['password'],
            decode_responses=True
        )
    
    async def cache_conversation(self, conversation_id: str, messages: List[ChatMessage], ttl: int = 3600):
        """Cache conversation messages"""
        try:
            cache_key = f"conversation:{conversation_id}"
            messages_data = [asdict(msg) for msg in messages]
            
            # Convert datetime objects to strings for JSON serialization
            for msg_data in messages_data:
                msg_data['timestamp'] = msg_data['timestamp'].isoformat()
                msg_data['message_type'] = msg_data['message_type'].value
                msg_data['provider'] = msg_data['provider'].value
            
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(messages_data)
            )
        except Exception as e:
            logging.error(f"Failed to cache conversation: {e}")
    
    async def get_cached_conversation(self, conversation_id: str) -> Optional[List[ChatMessage]]:
        """Get cached conversation messages"""
        try:
            cache_key = f"conversation:{conversation_id}"
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                messages_data = json.loads(cached_data)
                
                # Convert back to ChatMessage objects
                messages = []
                for msg_data in messages_data:
                    messages.append(ChatMessage(
                        id=msg_data['id'],
                        user_id=msg_data['user_id'],
                        conversation_id=msg_data['conversation_id'],
                        message_type=MessageType(msg_data['message_type']),
                        content=msg_data['content'],
                        timestamp=datetime.fromisoformat(msg_data['timestamp']),
                        metadata=msg_data['metadata'],
                        provider=ChatProvider(msg_data['provider']),
                        response_time_ms=msg_data.get('response_time_ms'),
                        token_count=msg_data.get('token_count'),
                        cost=msg_data.get('cost')
                    ))
                
                return messages
        except Exception as e:
            logging.error(f"Failed to get cached conversation: {e}")
        
        return None

class LobeChatProvider:
    """Lobe Chat API provider"""
    
    def __init__(self, config: ChatConfig):
        self.config = config
        self.api_url = config.lobe_chat['api_url']
        self.api_key = config.lobe_chat['api_key']
        self.model = config.lobe_chat['model']
        self.max_tokens = config.lobe_chat['max_tokens']
        self.temperature = config.lobe_chat['temperature']
        
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        })
    
    async def send_message(self, messages: List[Dict[str, str]], conversation_id: str) -> Dict[str, Any]:
        """Send message to Lobe Chat API"""
        start_time = time.time()
        
        try:
            payload = {
                'model': self.model,
                'messages': messages,
                'max_tokens': self.max_tokens,
                'temperature': self.temperature,
                'stream': False
            }
            
            response = self.session.post(
                f"{self.api_url}/chat/completions",
                json=payload,
                timeout=30
            )
            
            response_time_ms = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'content': data['choices'][0]['message']['content'],
                    'usage': data.get('usage', {}),
                    'response_time_ms': response_time_ms,
                    'provider': ChatProvider.LOBE_CHAT.value
                }
            else:
                return {
                    'success': False,
                    'error': f"API error: {response.status_code} - {response.text}",
                    'response_time_ms': response_time_ms
                }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'Request timeout',
                'response_time_ms': int((time.time() - start_time) * 1000)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response_time_ms': int((time.time() - start_time) * 1000)
            }

class ChatOrchestrator:
    """Main chat orchestration system"""
    
    def __init__(self, config_path: str = "config/chat_config.yaml"):
        self.config = ChatConfig(config_path)
        self.security = ChatSecurity(self.config)
        self.database = ChatDatabase(self.config)
        self.cache = ChatCache(self.config)
        self.lobe_chat = LobeChatProvider(self.config)
        
        # Metrics
        self.messages_processed = Counter('chat_messages_processed_total', 'Total chat messages processed', ['provider', 'status'])
        self.response_time = Histogram('chat_response_time_seconds', 'Chat response time', ['provider'])
        self.active_sessions = Gauge('chat_active_sessions', 'Number of active chat sessions')
        
        self.logger = structlog.get_logger("chat_orchestrator")
    
    async def process_message(self, user_id: str, conversation_id: str, content: str, provider: ChatProvider = ChatProvider.LOBE_CHAT) -> Dict[str, Any]:
        """Process incoming chat message"""
        try:
            # Validate input
            if not content.strip():
                raise ValueError("Message content cannot be empty")
            
            # Create message
            message_id = str(uuid.uuid4())
            user_message = ChatMessage(
                id=message_id,
                user_id=user_id,
                conversation_id=conversation_id,
                message_type=MessageType.USER,
                content=content,
                timestamp=datetime.utcnow(),
                metadata={'provider_requested': provider.value},
                provider=provider
            )
            
            # Save user message
            self.database.save_message(user_message)
            
            # Get conversation history
            history = await self.cache.get_cached_conversation(conversation_id)
            if not history:
                history = self.database.get_conversation_history(conversation_id)
                await self.cache.cache_conversation(conversation_id, history)
            
            # Prepare messages for API
            api_messages = []
            for msg in reversed(history[-10:]):  # Last 10 messages for context
                api_messages.append({
                    'role': msg.message_type.value,
                    'content': msg.content
                })
            
            # Add current user message
            api_messages.append({
                'role': 'user',
                'content': content
            })
            
            # Send to provider
            if provider == ChatProvider.LOBE_CHAT:
                response = await self.lobe_chat.send_message(api_messages, conversation_id)
            else:
                # Add support for other providers here
                response = {'success': False, 'error': f'Provider {provider.value} not implemented'}
            
            if response['success']:
                # Create assistant message
                assistant_message_id = str(uuid.uuid4())
                assistant_message = ChatMessage(
                    id=assistant_message_id,
                    user_id=user_id,
                    conversation_id=conversation_id,
                    message_type=MessageType.ASSISTANT,
                    content=response['content'],
                    timestamp=datetime.utcnow(),
                    metadata={'usage': response.get('usage', {})},
                    provider=provider,
                    response_time_ms=response.get('response_time_ms'),
                    token_count=response.get('usage', {}).get('total_tokens'),
                    cost=0.0  # Calculate based on provider pricing
                )
                
                # Save assistant message
                self.database.save_message(assistant_message)
                
                # Update cache
                history.append(user_message)
                history.append(assistant_message)
                await self.cache.cache_conversation(conversation_id, history)
                
                # Update metrics
                self.messages_processed.labels(provider=provider.value, status='success').inc()
                if response.get('response_time_ms'):
                    self.response_time.labels(provider=provider.value).observe(response['response_time_ms'] / 1000)
                
                self.logger.info(
                    "Message processed successfully",
                    user_id=user_id,
                    conversation_id=conversation_id,
                    provider=provider.value,
                    response_time_ms=response.get('response_time_ms')
                )
                
                return {
                    'success': True,
                    'message_id': assistant_message_id,
                    'content': response['content'],
                    'response_time_ms': response.get('response_time_ms'),
                    'usage': response.get('usage', {}),
                    'cost': 0.0
                }
            else:
                # Handle error
                error_message_id = str(uuid.uuid4())
                error_message = ChatMessage(
                    id=error_message_id,
                    user_id=user_id,
                    conversation_id=conversation_id,
                    message_type=MessageType.ERROR,
                    content=f"Error: {response['error']}",
                    timestamp=datetime.utcnow(),
                    metadata={'error': response['error']},
                    provider=provider,
                    response_time_ms=response.get('response_time_ms')
                )
                
                self.database.save_message(error_message)
                
                self.messages_processed.labels(provider=provider.value, status='error').inc()
                
                self.logger.error(
                    "Message processing failed",
                    user_id=user_id,
                    conversation_id=conversation_id,
                    provider=provider.value,
                    error=response['error']
                )
                
                return {
                    'success': False,
                    'error': response['error'],
                    'response_time_ms': response.get('response_time_ms')
                }
                
        except Exception as e:
            self.logger.error(
                "Unexpected error in message processing",
                user_id=user_id,
                conversation_id=conversation_id,
                error=str(e)
            )
            
            return {
                'success': False,
                'error': f"Internal server error: {str(e)}"
            }
    
    async def create_session(self, user_id: str, session_name: str) -> str:
        """Create new chat session"""
        session_id = str(uuid.uuid4())
        session = ChatSession(
            id=session_id,
            user_id=user_id,
            session_name=session_name,
            created_at=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            message_count=0,
            total_tokens=0,
            total_cost=0.0,
            metadata={}
        )
        
        self.database.save_session(session)
        self.active_sessions.inc()
        
        self.logger.info(
            "Chat session created",
            user_id=user_id,
            session_id=session_id,
            session_name=session_name
        )
        
        return session_id

# FastAPI application
app = FastAPI(
    title="IZA OS Chat Integration",
    description="Enterprise-grade chat integration with Lobe Chat",
    version="1.0.0"
)

# Global orchestrator instance
orchestrator = None

@app.on_event("startup")
async def startup_event():
    """Initialize orchestrator on startup"""
    global orchestrator
    orchestrator = ChatOrchestrator()
    
    # Start metrics server
    start_http_server(8001)
    
    logging.info("IZA OS Chat Integration started")

# Pydantic models for API
class MessageRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    conversation_id: str = Field(..., description="Conversation ID")
    content: str = Field(..., min_length=1, max_length=4000, description="Message content")
    provider: str = Field(default="lobe_chat", description="Chat provider")

class SessionRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    session_name: str = Field(..., min_length=1, max_length=100, description="Session name")

# API endpoints
@app.post("/api/chat/message")
async def send_message(request: MessageRequest):
    """Send chat message"""
    try:
        provider = ChatProvider(request.provider)
        result = await orchestrator.process_message(
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            content=request.content,
            provider=provider
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/chat/session")
async def create_session(request: SessionRequest):
    """Create new chat session"""
    try:
        session_id = await orchestrator.create_session(
            user_id=request.user_id,
            session_name=request.session_name
        )
        return {"session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/chat/conversation/{conversation_id}")
async def get_conversation(conversation_id: str, limit: int = 50):
    """Get conversation history"""
    try:
        history = orchestrator.database.get_conversation_history(conversation_id, limit)
        return {"messages": [asdict(msg) for msg in history]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
