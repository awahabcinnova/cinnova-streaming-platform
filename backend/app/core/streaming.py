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
    """
    Custom streaming response that properly handles HTTP Range requests for video files.
    This is necessary because StaticFiles doesn't handle Range requests properly for video streaming.
    """
    
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
        
        # Set default headers
        self.headers = headers or {}
        self.headers.setdefault("Accept-Ranges", "bytes")
        
        # Determine content type based on file extension
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
        # Open the file in binary mode
        file_handle = open(self.file_path, "rb")
        
        # Seek to the start position
        file_handle.seek(start)
        
        # Calculate the actual content length
        content_length = min(end - start + 1, file_size - start)
        
        # Prepare headers for the response
        response_headers = dict(self.headers)
        response_headers["Content-Length"] = str(content_length)
        
        if start != 0 or end != file_size - 1:
            # This is a partial content response
            response_headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
        
        return file_handle, content_length, response_headers
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        request = Request(scope)
        
        # Get file size
        if not os.path.exists(self.file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        file_size = os.path.getsize(self.file_path)
        
        # Parse range header if present
        range_header = request.headers.get("range")
        start, end = 0, file_size - 1
        
        if range_header:
            try:
                # Parse range header like "bytes=1024-2048" or "bytes=1024-"
                match = re.search(r"bytes=(\d*)-(\d*)", range_header)
                if match:
                    start_str, end_str = match.groups()
                    
                    if start_str:
                        start = int(start_str)
                    
                    if end_str:
                        end = int(end_str)
                    else:
                        # If no end specified, go to end of file
                        end = file_size - 1
                    
                    # Validate range
                    if start >= file_size:
                        await send({
                            "type": "http.response.start",
                            "status": 416,  # Range Not Satisfiable
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
                    
                    # Set status code to 206 for partial content
                    self.status_code = 206
                else:
                    # Invalid range header format, ignore it
                    range_header = None
            except (ValueError, IndexError):
                # Invalid range header format, ignore it
                range_header = None
        
        # Stream the file
        file_handle, content_length, response_headers = await self.stream_file(start, end, file_size)
        
        # Prepare headers
        header_list = []
        for key, value in response_headers.items():
            header_list.append((key.encode("latin-1"), value.encode("latin-1")))
        
        # Send response start
        await send({
            "type": "http.response.start",
            "status": self.status_code,
            "headers": header_list,
        })
        
        # Stream the file in chunks
        sent = 0
        chunk_size = 65536  # 64KB chunks
        
        try:
            while sent < content_length:
                # Calculate remaining bytes to send
                remaining = content_length - sent
                current_chunk_size = min(chunk_size, remaining)
                
                # Read chunk
                chunk = file_handle.read(current_chunk_size)
                if not chunk:
                    break
                
                # Send chunk
                await send({
                    "type": "http.response.body",
                    "body": chunk,
                    "more_body": sent + len(chunk) < content_length,
                })
                
                sent += len(chunk)
        finally:
            # Close the file handle
            file_handle.close()
            
            # Execute background task if present
            if self.background:
                await self.background()