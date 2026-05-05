
import os
import logging
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from agents.l1_triage import L1TriageAgent
from harness.lifecycle_hooks import LifecycleHooks
from harness.verify_interface import VerifyInterface
from harness.state_store import StateStore
from dataclasses import asdict

router = APIRouter()

@router.post("/api/v1/wazuh/alert")
async def wazuh_webhook(request: Request):
    """
    Receives alerts from Wazuh Manager.
    """
    try:
        secret = os.getenv("WAZUH_WEBHOOK_SECRET")
        auth_header = request.headers.get("X-PhishSlayer-Key")
        
        if not secret or auth_header != secret:
            logging.warning("Unauthorized webhook attempt to /api/v1/wazuh/alert")
            return JSONResponse({"error": "Unauthorized"}, status_code=401)
        
        payload = await request.json()
        
        rule_level = payload.get("rule", {}).get("level", 0)
        
        if rule_level >= 12:
            severity = "critical"
        elif rule_level >= 8:
            severity = "high"
        elif rule_level >= 4:
            severity = "medium"
        else:
            severity = "low"
            
        if rule_level < 4:
            # Ignore noise
            return JSONResponse({"status": "ignored", "reason": "Level below threshold"}, status_code=200)
            
        alert_id = payload.get("id", "unknown")
        org_id = "wazuh-default"
        
        hooks = LifecycleHooks()
        verify = VerifyInterface()
        state = StateStore()
        agent = L1TriageAgent(lifecycle_hooks=hooks, verify=verify, state_store=state)
        
        result = await agent.triage(
            alert_id=alert_id,
            org_id=org_id,
            raw_alert=payload
        )
        
        return JSONResponse({"alert_id": alert_id, "verdict": result.verdict})
        
    except Exception as e:
        logging.error(f"Wazuh webhook error: {e}")
        return JSONResponse({"error": "Internal server error"}, status_code=500)
