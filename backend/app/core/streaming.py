from __future__ import annotations

import os
import re
from pathlib import Path
from typing import BinaryIO, Dict, Optional
from fastapi import HTTPException, Request
from fastapi.responses import Response
from starlette.background import BackgroundTask
from starlette.convertors import Convertor
from starlette.datastructures import Headers
from starlette.types import Receive, Scope, Send


class StreamingResponseWithRange(Response):
    def __init__(
        self,
        file_path: str,
        status_code: int = 200,
        headers: Optional[Dict[str, str]] = None,
        media_type: Optional[str] = None,
        background: Optional[BackgroundTask] = None,
    ) -> None:
        self.file_path = file_path
        self.status_code = status_code
        self.background = background
                self.headers = headers or {}
        self.headers.setdefault("Accept-Ranges", "bytes")
        
        if media_type is None:
            file_ext = Path(file_path).suffix.lower()
            content_types = {
                ".mp4": "video/mp4",
                ".webm": "video/webm",
                ".ogg": "video/ogg",
                ".mov": "video/quicktime",
                ".avi": "video/x-msvideo",
                ".wmv": "video/x-ms-wmv",
                ".flv": "video/x-flv",
                ".mkv": "video/x-matroska",
                ".m3u8": "application/vnd.apple.mpegurl",
                ".ts": "video/mp2t",
            }
            media_type = content_types.get(file_ext, "application/octet-stream")
        
        self.media_type = media_type
    
    async def stream_file(self, start: int, end: int, file_size: int) -> tuple[BinaryIO, int, Dict[str, str]]:
        """Stream a portion of the file."""
        file_handle = open(self.file_path, "rb")
        
        file_handle.seek(start)
        
        content_length = min(end - start + 1, file_size - start)
        
        response_headers = dict(self.headers)
        response_headers["Content-Length"] = str(content_length)
        
        if start != 0 or end != file_size - 1:
            response_headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
        
        return file_handle, content_length, response_headers
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        request = Request(scope)
        
        if not os.path.exists(self.file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        file_size = os.path.getsize(self.file_path)
        
        range_header = request.headers.get("range")
        start, end = 0, file_size - 1
        
        if range_header:
            try:
                match = re.search(r"bytes=(\d*)-(\d*)", range_header)
                if match:
                    start_str, end_str = match.groups()
                    
                    if start_str:
                        start = int(start_str)
                    
                    if end_str:
                        end = int(end_str)
                    else:
                        end = file_size - 1
                    
                    if start >= file_size:
                        await send({
                            "type": "http.response.start",
                            "status": 416, 
                            "headers": [
                                (b"content-range", f"bytes */{file_size}".encode()),
                            ],
                        })
                        await send({
                            "type": "http.response.body",
                            "body": b"",
                            "more_body": False,
                        })
                        return
                    
                    if end >= file_size:
                        end = file_size - 1
                    
                    self.status_code = 206
                else:
                    range_header = None
            except (ValueError, IndexError):
                range_header = None
        
        file_handle, content_length, response_headers = await self.stream_file(start, end, file_size)
        
        header_list = []
        for key, value in response_headers.items():
            header_list.append((key.encode("latin-1"), value.encode("latin-1")))
        
        await send({
            "type": "http.response.start",
            "status": self.status_code,
            "headers": header_list,
        })
        
        sent = 0
        chunk_size = 65536 
        
        try:
            while sent < content_length:
                remaining = content_length - sent
                current_chunk_size = min(chunk_size, remaining)
                
                chunk = file_handle.read(current_chunk_size)
                if not chunk:
                    break
                
                await send({
                    "type": "http.response.body",
                    "body": chunk,
                    "more_body": sent + len(chunk) < content_length,
                })
                
                sent += len(chunk)
        finally:
            file_handle.close()
            
            if self.background:
                await self.background()