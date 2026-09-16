from pydantic import BaseModel
from typing import List


class ChatMessage(BaseModel):
    role: str          # "user" or "assistant"
    content: str


class CopilotRequest(BaseModel):
    question: str
    history: List[ChatMessage] = []


class CopilotResponse(BaseModel):
    answer: str
    suggested_commands: List[str] = []
    references: List[str] = []
