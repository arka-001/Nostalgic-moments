from pydantic import BaseModel, Field
from typing import Optional


class HealthCheckResponse(BaseModel):
    status: str = Field(..., example="ok")
    app: str = Field(..., example="Nostalgic Music Platform API")
    version: str = Field(..., example="1.0.0")
    database: str = Field(..., example="connected")
    timestamp: str
