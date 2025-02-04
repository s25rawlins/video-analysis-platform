from sqlalchemy import (
    Column, Integer, String, DateTime,
    Enum, Float, Text, ForeignKey
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
import enum
from datetime import datetime

Base = declarative_base()

class ProcessingStatus(enum.Enum):
    """
    Enum for tracking the video processing pipeline status
    """
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    QUEUED = "queued"

class Video(Base):
    """
    SQLAlchemy model for storing video metadata and processing results.
    """
    __tablename__ = "videos"

    # Core Identification Fields
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    s3_url = Column(String)

    # Status and Tracking
    status = Column(
        Enum(ProcessingStatus),
        default=ProcessingStatus.UPLOADED,
        nullable=False
    )
    processing_attempts = Column(Integer, default=0)
    processing_duration = Column(Float, nullable=True)  # New: track processing time in seconds
    transcription_confidence = Column(Float, nullable=True)  # New: overall confidence score

    # Timestamps
    upload_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_time = Column(DateTime, nullable=True)
    last_modified = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Video Technical Metadata
    video_metadata = Column(JSONB, nullable=True)
    """
    Structure:
    {
        "duration": float,        # in seconds
        "file_size": int,        # in bytes
        "format": str,           # e.g., "mp4"
        "codec": str,            # e.g., "h264"
        "resolution": {
            "width": int,
            "height": int
        },
        "frame_rate": float,
        "bitrate": int
    }
    """

    # ML Processing Results
    transcription = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    analysis_results = Column(JSONB, nullable=True)
    """
    Structure:
    {
        "sentiment": {
            "score": float,
            "magnitude": float
        },
        "language": {
            "detected": str,
            "confidence": float
        },
        "content_categories": [
            {
                "category": str,
                "confidence": float
            }
        ]
    }
    """

    # Transcription Details
    transcription_details = Column(JSONB, nullable=True)
    """
    Structure:
    {
        "text": "full transcription",
        "segments": [
            {
                "start": float,
                "end": float,
                "text": str,
                "confidence": float,
                "words": [
                    {
                        "word": str,
                        "start": float,
                        "end": float,
                        "confidence": float
                    }
                ]
            }
        ],
        "word_count": int,
        "language": str
    }
    """

    # Error Handling
    error_message = Column(Text, nullable=True)

    # User Management
    created_by = Column(String, index=True)

    def __repr__(self):
        """String representation of the Video model"""
        return f"<Video(id={self.id}, filename='{self.filename}', status='{self.status}')>"

    def to_dict(self):
        """Convert video model to dictionary for API responses"""
        return {
            "id": self.id,
            "filename": self.filename,
            "status": self.status.value,
            "upload_time": self.upload_time.isoformat(),
            "processed_time": self.processed_time.isoformat() if self.processed_time else None,
            "s3_url": self.s3_url,
            "video_metadata": self.video_metadata,
            "analysis_results": self.analysis_results,
            "transcription": self.transcription,
            "transcription_details": self.transcription_details,
            "processing_duration": self.processing_duration,
            "transcription_confidence": self.transcription_confidence,
            "error_message": self.error_message if self.status == ProcessingStatus.FAILED else None,
            "created_by": self.created_by
        }