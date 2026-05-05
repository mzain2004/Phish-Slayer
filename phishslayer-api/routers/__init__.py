# FILE: routers/__init__.py
# Routers package - imports all router modules

from . import (
    alerts,
    assets,
    cases,
    connectors,
    cron,
    detection,
    health,
    hunting,
    incidents,
    ingest,
    intel,
    metrics,
    mitre,
    osint,
    playbooks,
    settings,
    sigma,
    soc,
    users,
    wazuh
)

__all__ = [
    "alerts",
    "assets",
    "cases",
    "connectors",
    "cron",
    "detection",
    "health",
    "hunting",
    "incidents",
    "ingest",
    "intel",
    "metrics",
    "mitre",
    "osint",
    "playbooks",
    "settings",
    "sigma",
    "soc",
    "users",
    "wazuh"
]
