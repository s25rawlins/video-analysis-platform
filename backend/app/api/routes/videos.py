from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from app.services.s3 import S3Service
from app.services.transcription import TranscriptionService
from app.crud.video import VideoRepository
from app.db.session import get_db
from app.models.video import Video, ProcessingStatus
from datetime import datetime, timedelta
import logging

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    s3_service: S3Service = Depends(S3Service),
    db: Session = Depends(get_db),
):
    """
    Upload a video file and create database record
    """
    if not file.content_type.startswith('video/'):
        raise HTTPException(
            status_code=400,
            detail="File uploaded is not a video"
        )
    
    try:
        # Upload to S3
        s3_url = await s3_service.upload_video(file)
        if not s3_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload video to storage"
            )
        
        # Create database record
        video = await VideoRepository.create_video(
            db=db,
            filename=file.filename,
            s3_url=s3_url
        )
        
        return {
            "id": video.id,
            "filename": video.filename,
            "status": video.status.value,
            "s3_url": video.s3_url
        }
        
    except Exception as e:
        logger.error(f"Error processing video upload: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error processing video upload"
        )

@router.post("/{video_id}/transcribe")
async def transcribe_video(
    video_id: int,
    transcription_service: TranscriptionService = Depends(TranscriptionService),
    db: Session = Depends(get_db)
):
    """
    Transcribe a video by ID
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        video.status = ProcessingStatus.PROCESSING
        db.commit()
        
        transcription_details = await transcription_service.process_video(video.s3_url)
        
        video = await VideoRepository.update_transcription(db, video_id, transcription_details)
        
        return {
            "id": video.id,
            "status": video.status.value,
            "transcription": video.transcription,
            "details": video.transcription_details,
            "processed_time": video.processed_time.isoformat() if video.processed_time else None
        }
    except Exception as e:
        logger.error(f"Error transcribing video: {str(e)}")
        video.status = ProcessingStatus.FAILED
        video.error_message = str(e)
        db.commit()
        raise HTTPException(
            status_code=500,
            detail=f"Error transcribing video: {str(e)}"
        )

@router.get("")
async def get_videos(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    order_by: str = Query(default="upload_time", regex="^(upload_time|filename|status|processing_duration|transcription_confidence)$"),
    order: str = Query(default="desc", regex="^(asc|desc)$"),
    min_duration: Optional[float] = Query(default=None, ge=0),
    max_duration: Optional[float] = Query(default=None, ge=0),
    min_file_size: Optional[int] = Query(default=None, ge=0),
    max_file_size: Optional[int] = Query(default=None, ge=0),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None)  
):
    """
    Get list of all videos with filters and pagination
    """
    try:
        # Start with base query
        query = db.query(Video)

        # Apply filters
        if status:
            query = query.filter(Video.status == ProcessingStatus(status))
        if search:
            query = query.filter(Video.filename.ilike(f"%{search}%"))
        if min_duration:
            query = query.filter(Video.video_metadata['duration'].cast(Float) >= min_duration)  
        if max_duration:
            query = query.filter(Video.video_metadata['duration'].cast(Float) <= max_duration)
        if min_file_size:
            query = query.filter(Video.video_metadata['file_size'].cast(Integer) >= min_file_size)
        if max_file_size:  
            query = query.filter(Video.video_metadata['file_size'].cast(Integer) <= max_file_size)
        if start_date:
            query = query.filter(Video.upload_time >= start_date)
        if end_date:
            query = query.filter(Video.upload_time <= end_date)

        # Count total before pagination
        total_count = query.count()

        # Apply ordering  
        order_column = getattr(Video, order_by)
        if order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)

        # Execute query
        videos = query.all()

        return {
            "items": [video.to_dict() for video in videos],
            "metadata": {
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": (total_count + page_size - 1) // page_size,
                "has_next": page * page_size < total_count,
                "has_previous": page > 1
            }
        }
    except Exception as e:
        logger.error(f"Error fetching videos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching videos: {str(e)}"  
        )