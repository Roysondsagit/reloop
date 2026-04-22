import os
import json
import boto3
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Singleton SNS client
_sns_client = None


def get_sns_client():
    """Returns a shared boto3 SNS client instance."""
    global _sns_client
    if _sns_client is None:
        _sns_client = boto3.client(
            "sns",
            region_name=os.getenv("AWS_REGION", "ap-south-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
    return _sns_client


def publish_analysis_event(payload: dict, subject: str = "ReLoop Analysis Complete") -> str | None:
    """
    Publishes a waste analysis result to SNS.
    This triggers any subscribed Lambda functions, email alerts, or SQS queues.

    Args:
        payload: Dictionary of analysis results to send.
        subject: SNS message subject line.

    Returns:
        SNS MessageId string, or None if SNS is not configured or fails.
    """
    topic_arn = os.getenv("SNS_TOPIC_ARN")
    if not topic_arn:
        logger.warning("⚠️ SNS_TOPIC_ARN not set — skipping SNS publish.")
        return None

    try:
        sns = get_sns_client()
        response = sns.publish(
            TopicArn=topic_arn,
            Subject=subject[:100],   # SNS subject max 100 chars
            Message=json.dumps(payload, default=str),
            MessageAttributes={
                "event_type": {
                    "DataType": "String",
                    "StringValue": payload.get("event_type", "analysis"),
                }
            },
        )
        msg_id = response.get("MessageId")
        logger.info(f"✅ SNS Published: MessageId={msg_id}")
        return msg_id

    except ClientError as e:
        logger.error(f"❌ SNS Publish Failed: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ SNS Unexpected Error: {e}")
        return None


def notify_hazardous_waste(item_name: str, material: str, image_url: str | None, location: dict | None = None) -> str | None:
    """
    Sends a high-priority SNS alert when hazardous waste is detected.
    Designed to trigger Lambda functions for emergency routing.

    Args:
        item_name: Detected hazardous item name (e.g. "Baby Diaper").
        material: Material category (e.g. "Hazardous").
        image_url: S3 URL of the annotated image (optional).
        location: Dict with 'lat' and 'lon' keys (optional).

    Returns:
        SNS MessageId or None.
    """
    payload = {
        "event_type": "hazardous_waste_alert",
        "item_name": item_name,
        "material": material,
        "image_s3_url": image_url,
        "location": location or {},
        "severity": "HIGH",
        "action_required": "Dispatch hazardous waste collection team",
    }
    return publish_analysis_event(
        payload=payload,
        subject="🚨 ALERT: Hazardous Waste Detected by ReLoop"
    )


def notify_analysis_complete(total_items: int, batch_dna: dict, image_s3_url: str | None) -> str | None:
    """
    Sends a routine SNS notification when a batch scan completes.

    Args:
        total_items: Total number of items detected.
        batch_dna: Material breakdown dictionary.
        image_s3_url: S3 URL of the annotated scan result.

    Returns:
        SNS MessageId or None.
    """
    payload = {
        "event_type": "scan_complete",
        "total_items_detected": total_items,
        "material_breakdown": batch_dna,
        "annotated_image_s3_url": image_s3_url,
    }
    return publish_analysis_event(
        payload=payload,
        subject=f"✅ ReLoop Scan Complete: {total_items} items detected"
    )
