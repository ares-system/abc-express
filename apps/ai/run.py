"""Run the ABC Express AI Service."""

import uvicorn
from .config import get_settings


def main():
    """Run the AI service."""
    settings = get_settings()
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )


if __name__ == "__main__":
    main()