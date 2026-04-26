"""WebSocket endpoints for real-time AI updates."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import json


router = APIRouter()


class ConnectionMessage(BaseModel):
    """WebSocket connection message."""

    type: str
    payload: dict


@router.websocket("/ai")
async def ai_websocket(websocket: WebSocket):
    """WebSocket endpoint for AI decisions."""
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle message types
            msg_type = message.get("type")

            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

            elif msg_type == "subscribe":
                # Subscribe to decision updates
                await websocket.send_text(
                    json.dumps({
                        "type": "subscribed",
                        "payload": {"channels": message.get("channels", [])}
                    })
                )

            elif msg_type == "generate":
                # Request AI decision generation
                await websocket.send_text(
                    json.dumps({
                        "type": "processing",
                        "payload": {"requestId": message.get("requestId")}
                    })
                )
                # TODO: stream via DecisionAgent + graph.astream when wired to this channel

            else:
                await websocket.send_text(
                    json.dumps({
                        "type": "error",
                        "payload": {"message": f"Unknown message type: {msg_type}"}
                    })
                )

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(
                json.dumps({
                    "type": "error",
                    "payload": {"message": str(e)}
                })
            )
        except Exception:
            pass


@router.websocket("/stream/{decision_id}")
async def decision_stream(websocket: WebSocket, decision_id: str):
    """WebSocket endpoint for streaming decision generation."""
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Send progress updates
            await websocket.send_text(
                json.dumps({
                    "type": "progress",
                    "payload": {
                        "decisionId": decision_id,
                        "step": message.get("step", "Starting"),
                        "progress": message.get("progress", 0)
                    }
                })
            )

    except WebSocketDisconnect:
        pass