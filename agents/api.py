import logging
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.orchestrator import AGENT_REGISTRY, AgentOrchestrator

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

app = FastAPI(title="AgentFi API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExecuteRequest(BaseModel):
    query: str


class AgentResponse(BaseModel):
    success: bool
    data: Any
    error: str | None


class AgentInfo(BaseModel):
    name: str
    description: str
    price_per_call: float


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/agents")
async def list_agents() -> AgentResponse:
    agents = [
        AgentInfo(
            name=agent.name,
            description=agent.description,
            price_per_call=agent.price_per_call,
        )
        for agent in AGENT_REGISTRY.values()
    ]
    return AgentResponse(success=True, data=[a.model_dump() for a in agents], error=None)


@app.post("/agents/{agent_id}/execute")
async def execute_single(agent_id: str, body: ExecuteRequest) -> AgentResponse:
    agent = AGENT_REGISTRY.get(agent_id)
    if not agent:
        return AgentResponse(success=False, data=None, error=f"Unknown agent: {agent_id}")
    result = await agent.execute(body.query)
    return AgentResponse(success=True, data=result, error=None)


@app.post("/orchestrate")
async def orchestrate(body: ExecuteRequest) -> AgentResponse:
    orchestrator = AgentOrchestrator()
    result = await orchestrator.execute(body.query)
    return AgentResponse(success=True, data=result, error=None)


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
