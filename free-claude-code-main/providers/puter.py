from __future__ import annotations
import json
import uuid
import httpx
from typing import Any, AsyncIterator
from loguru import logger

from providers.base import BaseProvider, ProviderConfig
from providers.common import SSEBuilder

class PuterProvider(BaseProvider):
    """Provider for Puter.js AI gateway."""

    def __init__(self, config: ProviderConfig, *, api_key: str):
        super().__init__(config)
        self._api_key = api_key
        self._base_url = "https://api.puter.com/drivers/call"
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(config.http_read_timeout, connect=config.http_connect_timeout)
        )

    async def cleanup(self) -> None:
        await self._client.aclose()

    async def stream_response(
        self,
        request: Any,
        input_tokens: int = 0,
        *,
        request_id: str | None = None,
    ) -> AsyncIterator[str]:
        """Stream response (simulated since Puter driver call is non-streaming)."""
        message_id = f"msg_{uuid.uuid4()}"
        sse = SSEBuilder(message_id, request.model, input_tokens)
        
        yield sse.message_start()
        
        model_name = request.model
        if "sonnet" in model_name.lower():
            model_name = "claude-3.5-sonnet"
        elif "opus" in model_name.lower():
            model_name = "claude-3-opus"
        elif "haiku" in model_name.lower():
            model_name = "claude-3-haiku"

        messages = []
        if request.system:
            if isinstance(request.system, str):
                messages.append({"role": "system", "content": request.system})
            elif isinstance(request.system, list):
                system_text = "\n".join([b.get("text", "") for b in request.system if b.get("type") == "text"])
                messages.append({"role": "system", "content": system_text})

        for msg in request.messages:
            content = ""
            if isinstance(msg.content, str):
                content = msg.content
            elif isinstance(msg.content, list):
                content = "\n".join([b.get("text", "") for b in msg.content if b.get("type") == "text"])
            messages.append({"role": msg.role, "content": content})

        try:
            logger.info(f"PUTER_REQUEST: model={model_name} msgs={len(messages)}")
            
            res = await self._client.post(
                self._base_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self._api_key}",
                },
                json={
                    "interface": "puter-chat-completion",
                    "driver": "ai-chat",
                    "test_mode": False,
                    "method": "complete",
                    "args": {
                        "messages": messages,
                        "model": model_name
                    },
                    "token": self._api_key,
                    "auth_token": self._api_key
                }
            )

            if res.status_code != 200:
                logger.error(f"Puter API error: {res.status_code} - {res.text}")
                yield sse.emit_error(f"Puter API error: {res.status_code}")
                return

            data = res.json()
            result = data.get("result", "")
            text = ""
            
            if isinstance(result, str):
                text = result
            elif isinstance(result, dict):
                text = result.get("message", {}).get("content", "")
                if not text:
                    text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            if not text:
                logger.warning(f"Puter returned empty result: {data}")
                text = " "

            yield sse.content_block_start(0, "text", text=text)
            yield sse.content_block_stop(0)
            
            yield sse.message_delta("end_turn", sse.estimate_output_tokens())
            yield sse.message_stop()

        except Exception as e:
            logger.error(f"Puter request failed: {e}")
            yield sse.emit_error(f"Puter request failed: {str(e)}")
