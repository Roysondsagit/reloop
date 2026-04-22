"""
ReLoop: AWS Lambda Function - SNS Event Processor

This Lambda function is triggered by the ReLoop SNS topic.
It receives waste analysis events (hazardous alerts, scan completions)
and can:
  - Log events to CloudWatch
  - Forward hazardous alerts to a team email (via SNS Email subscription)
  - Write event metadata to S3 for analytics
  - Trigger further automation workflows

Deployment:
  - Runtime: Python 3.11
  - Handler: index.lambda_handler
  - Trigger: SNS Topic (reloop-alerts)
  - Memory: 128 MB
  - Timeout: 30s
"""

import json
import os
import logging
import boto3
from datetime import datetime, timezone

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# S3 client for event logging (optional)
s3 = boto3.client("s3")
S3_BUCKET = os.environ.get("S3_BUCKET_NAME", "")
EVENT_LOG_PREFIX = "event-logs"


def lambda_handler(event, context):
    """
    Main Lambda handler. Processes SNS records from the ReLoop topic.

    Args:
        event: AWS Lambda event dict (contains SNS records).
        context: AWS Lambda context object.

    Returns:
        Dict with statusCode and body.
    """
    logger.info("🚀 ReLoop Lambda: Received event")

    processed = 0
    errors = 0

    for record in event.get("Records", []):
        try:
            # SNS message is a JSON string inside the record
            sns_payload = record.get("Sns", {})
            subject = sns_payload.get("Subject", "No Subject")
            raw_message = sns_payload.get("Message", "{}")
            message = json.loads(raw_message)

            logger.info(f"📨 SNS Subject: {subject}")
            logger.info(f"📦 Message Payload: {json.dumps(message, indent=2)}")

            event_type = message.get("event_type", "unknown")

            # ── Route by event type ─────────────────────────────────────────
            if event_type == "hazardous_waste_alert":
                handle_hazardous_alert(message, subject)

            elif event_type == "scan_complete":
                handle_scan_complete(message)

            else:
                logger.warning(f"⚠️ Unknown event_type: {event_type}")

            # ── Log to S3 for analytics ─────────────────────────────────────
            if S3_BUCKET:
                log_event_to_s3(event_type, message)

            processed += 1

        except Exception as e:
            logger.error(f"❌ Error processing SNS record: {e}", exc_info=True)
            errors += 1

    result = {
        "statusCode": 200,
        "body": json.dumps({
            "processed": processed,
            "errors": errors,
            "message": "Lambda execution complete"
        })
    }
    logger.info(f"✅ Lambda Complete: {processed} processed, {errors} errors")
    return result


def handle_hazardous_alert(message: dict, subject: str):
    """
    Handles hazardous waste detection events.
    Logs the alert and can trigger further automation.
    """
    item_name = message.get("item_name", "Unknown")
    material = message.get("material", "Unknown")
    image_url = message.get("image_s3_url", "N/A")
    location = message.get("location", {})

    logger.warning(
        f"🚨 HAZARDOUS ALERT | Item: {item_name} | Material: {material} "
        f"| Image: {image_url} | Location: {location}"
    )

    # TODO: Add your automation here, e.g.:
    # - Send SMS via Amazon Pinpoint
    # - Create a ticket in your system via API call
    # - Update a DynamoDB record
    # - Invoke another Lambda for dispatch routing


def handle_scan_complete(message: dict):
    """
    Handles routine scan completion events.
    """
    total = message.get("total_items_detected", 0)
    breakdown = message.get("material_breakdown", {})
    image_url = message.get("annotated_image_s3_url", "N/A")

    logger.info(
        f"✅ SCAN COMPLETE | Items: {total} | "
        f"Breakdown: {json.dumps(breakdown)} | Image: {image_url}"
    )

    # TODO: Add your reporting logic here, e.g.:
    # - Aggregate stats into DynamoDB
    # - Update a dashboard via API
    # - Send a daily summary report


def log_event_to_s3(event_type: str, message: dict):
    """
    Writes the event as a JSON log file to S3 for later analytics.
    Key format: event-logs/{event_type}/{YYYY-MM-DD}/{timestamp}.json
    """
    try:
        now = datetime.now(tz=timezone.utc)
        date_str = now.strftime("%Y-%m-%d")
        ts_str = now.strftime("%H%M%S%f")
        key = f"{EVENT_LOG_PREFIX}/{event_type}/{date_str}/{ts_str}.json"

        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(message, default=str).encode("utf-8"),
            ContentType="application/json",
        )
        logger.info(f"📝 Event logged to S3: s3://{S3_BUCKET}/{key}")
    except Exception as e:
        logger.warning(f"⚠️ Could not log event to S3: {e}")
