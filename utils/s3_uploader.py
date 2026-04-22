import os
import boto3
import uuid
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Initialize S3 client using env credentials
_s3_client = None


def get_s3_client():
    """Returns a shared boto3 S3 client instance."""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGION", "ap-south-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
    return _s3_client


def upload_image_to_s3(local_path: str, prefix: str = "uploads") -> str | None:
    """
    Uploads a local file to S3 and returns the public URL (or None on failure).

    Args:
        local_path: Absolute or relative path to the local file.
        prefix: S3 key prefix (folder). E.g. 'uploads', 'annotated'.

    Returns:
        S3 public URL string, or None if upload fails or S3 is not configured.
    """
    bucket = os.getenv("S3_BUCKET_NAME")
    if not bucket:
        logger.warning("⚠️ S3_BUCKET_NAME not set — skipping S3 upload.")
        return None

    if not os.path.exists(local_path):
        logger.warning(f"⚠️ File not found for S3 upload: {local_path}")
        return None

    try:
        ext = os.path.splitext(local_path)[-1] or ".jpg"
        key = f"{prefix}/{uuid.uuid4().hex}{ext}"

        s3 = get_s3_client()
        s3.upload_file(
            local_path,
            bucket,
            key,
            ExtraArgs={"ContentType": _get_content_type(ext)},
        )

        region = os.getenv("AWS_REGION", "ap-south-1")
        url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
        logger.info(f"✅ S3 Upload Success: {url}")
        return url

    except ClientError as e:
        logger.error(f"❌ S3 Upload Failed: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ S3 Unexpected Error: {e}")
        return None


def upload_bytes_to_s3(data: bytes, filename: str, prefix: str = "uploads") -> str | None:
    """
    Uploads raw bytes to S3. Useful for in-memory files.

    Returns:
        S3 public URL string, or None on failure.
    """
    bucket = os.getenv("S3_BUCKET_NAME")
    if not bucket:
        return None

    try:
        ext = os.path.splitext(filename)[-1] or ".bin"
        key = f"{prefix}/{uuid.uuid4().hex}{ext}"

        s3 = get_s3_client()
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=data,
            ContentType=_get_content_type(ext),
        )

        region = os.getenv("AWS_REGION", "ap-south-1")
        url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
        logger.info(f"✅ S3 Bytes Upload Success: {url}")
        return url

    except ClientError as e:
        logger.error(f"❌ S3 Bytes Upload Failed: {e}")
        return None


def _get_content_type(ext: str) -> str:
    """Maps file extension to MIME type."""
    mapping = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".webm": "audio/webm",
        ".mp3": "audio/mpeg",
        ".pdf": "application/pdf",
        ".json": "application/json",
    }
    return mapping.get(ext.lower(), "application/octet-stream")
