from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str
    size: int
