#!/usr/bin/env python3
"""
WhoDB Service Integration for IZA OS
Provides API endpoints to integrate WhoDB with the IZA OS ecosystem
"""

import requests
import json
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class WhoDBIntegration:
    def __init__(self, whodb_url: str = "http://localhost:8080"):
        self.whodb_url = whodb_url
        self.session = requests.Session()
    
    def get_database_connections(self) -> List[Dict[str, Any]]:
        """Get all connected databases from WhoDB"""
        try:
            response = self.session.get(f"{self.whodb_url}/api/connections")
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logger.error(f"Error getting database connections: {e}")
            return []
    
    def execute_natural_language_query(self, query: str, database: str = "default") -> Dict[str, Any]:
        """Execute natural language query using Ollama integration"""
        try:
            payload = {
                "query": query,
                "database": database,
                "use_ai": True
            }
            response = self.session.post(f"{self.whodb_url}/api/query/natural", json=payload)
            if response.status_code == 200:
                return response.json()
            return {"error": "Query execution failed"}
        except Exception as e:
            logger.error(f"Error executing natural language query: {e}")
            return {"error": str(e)}
    
    def get_schema_visualization(self, database: str) -> Dict[str, Any]:
        """Get schema visualization for a database"""
        try:
            response = self.session.get(f"{self.whodb_url}/api/schema/{database}")
            if response.status_code == 200:
                return response.json()
            return {}
        except Exception as e:
            logger.error(f"Error getting schema visualization: {e}")
            return {}
    
    def get_ecosystem_health(self) -> Dict[str, Any]:
        """Get WhoDB health status for IZA OS ecosystem"""
        try:
            response = self.session.get(f"{self.whodb_url}/api/health")
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "service": "whodb",
                    "ecosystem_integration": True,
                    "databases_connected": len(self.get_database_connections()),
                    "ai_integration": True
                }
            return {"status": "unhealthy"}
        except Exception as e:
            logger.error(f"Error checking WhoDB health: {e}")
            return {"status": "unhealthy", "error": str(e)}

# Integration with IZA OS ecosystem
def integrate_whodb_with_iza_os():
    """Integrate WhoDB with the IZA OS ecosystem"""
    whodb = WhoDBIntegration()
    
    # Check health
    health = whodb.get_ecosystem_health()
    print(f"WhoDB Health: {health}")
    
    # Get connected databases
    connections = whodb.get_database_connections()
    print(f"Connected Databases: {len(connections)}")
    
    # Example natural language query
    result = whodb.execute_natural_language_query(
        "Show me all businesses scraped in the last 30 days",
        "supabase_postgres"
    )
    print(f"Query Result: {result}")
    
    return whodb

if __name__ == "__main__":
    integrate_whodb_with_iza_os()
