"""
File upload router for handling image uploads
"""
import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
try:
    import aiofiles
    AIOFILES_AVAILABLE = True
except ImportError:
    AIOFILES_AVAILABLE = False

from ..dependencies import get_current_user
from ..models.user import User

router = APIRouter(prefix="/upload", tags=["uploads"])

# Configuration
UPLOAD_DIRECTORY = Path("uploads")
IMAGES_DIRECTORY = UPLOAD_DIRECTORY / "images"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
IMAGE_SIZES = {
    "thumbnail": (150, 150),
    "medium": (400, 400),
    "large": (800, 600)
}

# Ensure upload directories exist
IMAGES_DIRECTORY.mkdir(parents=True, exist_ok=True)


def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""
    # Check file extension
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Supported types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    if hasattr(file.file, 'seek') and hasattr(file.file, 'tell'):
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )


async def save_image_with_sizes(
    file: UploadFile, 
    filename: str
) -> dict:
    """Save image in multiple sizes"""
    file_path = IMAGES_DIRECTORY / filename
    
    # Save original file
    if AIOFILES_AVAILABLE:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
    else:
        # Fallback to synchronous file operations
        with open(file_path, 'wb') as f:
            content = await file.read()
            f.write(content)
    
    # Generate different sizes
    image_urls = {}
    
    if not PIL_AVAILABLE:
        # If PIL is not available, just return the original image URL
        image_urls['original'] = f"/upload/images/{filename}"
        return image_urls
    
    try:
        with Image.open(file_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            
            # Save original
            image_urls['original'] = f"/upload/images/{filename}"
            
            # Generate thumbnails
            for size_name, dimensions in IMAGE_SIZES.items():
                resized_img = img.copy()
                resized_img.thumbnail(dimensions, Image.Resampling.LANCZOS)
                
                # Create filename for resized image
                name_parts = filename.rsplit('.', 1)
                resized_filename = f"{name_parts[0]}_{size_name}.{name_parts[1]}"
                resized_path = IMAGES_DIRECTORY / resized_filename
                
                # Save resized image
                resized_img.save(resized_path, optimize=True, quality=85)
                image_urls[size_name] = f"/upload/images/{resized_filename}"
                
    except Exception as e:
        # Clean up original file if thumbnail generation fails
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image: {str(e)}"
        )
    
    return image_urls


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and process an image file
    Returns URLs for different image sizes
    """
    # Validate file
    validate_image_file(file)
    
    # Generate unique filename
    file_ext = Path(file.filename or "").suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    try:
        # Save image with multiple sizes
        image_urls = await save_image_with_sizes(file, unique_filename)
        
        message = "Image uploaded successfully"
        if not PIL_AVAILABLE:
            message += " (image resizing not available - PIL/Pillow not installed)"
        
        return {
            "message": message,
            "filename": unique_filename,
            "urls": image_urls
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.get("/images/{filename}")
async def get_image(filename: str):
    """
    Serve uploaded images
    """
    file_path = IMAGES_DIRECTORY / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    return FileResponse(
        path=file_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=31536000"}  # Cache for 1 year
    )


@router.delete("/images/{filename}")
async def delete_image(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete an uploaded image and its thumbnails
    """
    # Find all related files (original + thumbnails)
    name_parts = filename.rsplit('.', 1)
    if len(name_parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename format"
        )
    
    base_name, extension = name_parts
    files_to_delete = []
    
    # Add original file
    original_path = IMAGES_DIRECTORY / filename
    if original_path.exists():
        files_to_delete.append(original_path)
    
    # Add thumbnail files
    for size_name in IMAGE_SIZES.keys():
        thumbnail_filename = f"{base_name}_{size_name}.{extension}"
        thumbnail_path = IMAGES_DIRECTORY / thumbnail_filename
        if thumbnail_path.exists():
            files_to_delete.append(thumbnail_path)
    
    if not files_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Delete all files
    deleted_count = 0
    for file_path in files_to_delete:
        try:
            file_path.unlink()
            deleted_count += 1
        except Exception as e:
            print(f"Warning: Failed to delete {file_path}: {e}")
    
    return {
        "message": f"Successfully deleted {deleted_count} files",
        "filename": filename
    }


@router.get("/images")
async def list_images(
    current_user: User = Depends(get_current_user)
):
    """
    List all uploaded images (admin only for now)
    """
    if not IMAGES_DIRECTORY.exists():
        return {"images": []}
    
    images = []
    for file_path in IMAGES_DIRECTORY.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in ALLOWED_EXTENSIONS:
            # Skip thumbnail files
            if not any(f"_{size}_" in file_path.name for size in IMAGE_SIZES.keys()):
                images.append({
                    "filename": file_path.name,
                    "url": f"/upload/images/{file_path.name}",
                    "size": file_path.stat().st_size,
                    "created_at": file_path.stat().st_ctime
                })
    
    return {"images": images}