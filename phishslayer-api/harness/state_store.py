
"""
state_store.py — S in ETCSLV.
Persists agent findings to MongoDB. Agents never store state in memory.
Decepticon pattern: findings persist to store, not agent context.
"""

import os
import logging
from datetime import datetime
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from dataclasses import dataclass, asdict
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env.local")

@dataclass
class AlertState:
    """Full state record for one alert across all agent phases."""
    alert_id: str
    org_id: str
    status: str              # "triaging"|"investigating"|"hunting"|"pending_approval"|"closed"
    l1_result: Optional[dict] = None
    l2_result: Optional[dict] = None
    l3_result: Optional[dict] = None
    requires_human_approval: bool = False
    approval_action: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class StateStore:
    """
    S in ETCSLV. MongoDB-backed state for all alerts.
    Org-scoped: every query filters by org_id. No cross-org data access.
    """
    
    # Memory fallback for dev environments without MongoDB
    _memory_db = {}

    def __init__(self, mongodb_uri: Optional[str] = None):
        self.uri = mongodb_uri or os.getenv("MONGODB_URI")
        self._client = None
        self._db = None
        self._collection = None
        
        if not self.uri:
            logging.warning("MONGODB_URI missing. StateStore will use memory fallback.")
            return

        try:
            self._client = AsyncIOMotorClient(self.uri, serverSelectionTimeoutMS=2000)
            self._db = self._client.get_database()
            self._collection = self._db.get_collection("agent_states")
        except Exception as e:
            logging.error(f"Failed to connect to MongoDB: {e}. Using memory fallback.")

    async def save(self, alert_id: str, stage: str, data: dict, org_id: str) -> None:
        """
        Upsert alert state. 
        stage: "l1", "l2", "l3"
        """
        update_field = f"{stage}_result"
        now = datetime.utcnow()

        if self._collection is not None:
            try:
                await self._collection.update_one(
                    {"alert_id": alert_id, "org_id": org_id},
                    {
                        "$set": {
                            update_field: data,
                            "updated_at": now,
                            "org_id": org_id
                        },
                        "$setOnInsert": {
                            "created_at": now,
                            "status": "triaging" if stage == "l1" else "active"
                        }
                    },
                    upsert=True
                )
                return
            except Exception as e:
                logging.error(f"StateStore.save to MongoDB failed: {e}. Falling back to memory.")

        # Memory Fallback
        key = f"{org_id}:{alert_id}"
        if key not in self._memory_db:
            self._memory_db[key] = {
                "alert_id": alert_id,
                "org_id": org_id,
                "created_at": now,
                "status": "triaging" if stage == "l1" else "active"
            }
        
        self._memory_db[key][update_field] = data
        self._memory_db[key]["updated_at"] = now

    async def get(self, alert_id: str, org_id: str) -> Optional[dict]:
        """Fetch state by alert_id. org_id required for scoping."""
        doc = None
        if self._collection is not None:
            try:
                doc = await self._collection.find_one({"alert_id": alert_id, "org_id": org_id})
                if doc and "_id" in doc:
                    doc.pop("_id")
            except Exception as e:
                logging.error(f"StateStore.get from MongoDB failed: {e}. Falling back to memory.")
        
        if not doc:
            key = f"{org_id}:{alert_id}"
            doc = self._memory_db.get(key)
        
        if doc:
            # Make JSON serializable
            for k, v in doc.items():
                if isinstance(v, datetime):
                    doc[k] = v.isoformat()
            return doc
        return None

    async def list_recent(self, org_id: str, limit: int = 50) -> List[dict]:
        """Return alerts for this org sorted by updated_at desc."""
        results = []
        if self._collection is not None:
            try:
                cursor = self._collection.find({"org_id": org_id}).sort("updated_at", -1).limit(limit)
                async for doc in cursor:
                    if "_id" in doc:
                        doc.pop("_id")
                    results.append(doc)
            except Exception as e:
                logging.error(f"StateStore.list_recent from MongoDB failed: {e}. Falling back to memory.")
        
        if not results:
            # Memory fallback search
            results = [v for k, v in self._memory_db.items() if v["org_id"] == org_id]
            results.sort(key=lambda x: x.get("updated_at", datetime.min), reverse=True)
            results = results[:limit]
        
        # Make JSON serializable
        for doc in results:
            for k, v in doc.items():
                if isinstance(v, datetime):
                    doc[k] = v.isoformat()
        return results

    async def update_status(self, alert_id: str, org_id: str, status: str) -> None:
        """Update status field only."""
        if self._collection is not None:
            try:
                await self._collection.update_one(
                    {"alert_id": alert_id, "org_id": org_id},
                    {"$set": {"status": status, "updated_at": datetime.utcnow()}}
                )
                return
            except Exception as e:
                logging.error(f"StateStore.update_status to MongoDB failed: {e}. Falling back to memory.")
        
        key = f"{org_id}:{alert_id}"
        if key in self._memory_db:
            self._memory_db[key]["status"] = status
            self._memory_db[key]["updated_at"] = datetime.utcnow()
