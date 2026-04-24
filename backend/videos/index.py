"""
Функции для работы с видео: загрузка в S3, сохранение в БД, получение списка.
"""
import os
import json
import uuid
import base64
import psycopg2
import boto3

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")

    # GET /videos — список всех видео
    if method == "GET":
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, title, channel, description, duration, views, likes, dislikes, category, thumb_url, video_url, created_at "
            f"FROM {SCHEMA}.videos ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        videos = []
        for r in rows:
            videos.append({
                "id": r[0],
                "title": r[1],
                "channel": r[2],
                "description": r[3],
                "duration": r[4],
                "views": r[5],
                "likes": r[6],
                "dislikes": r[7],
                "category": r[8],
                "thumb_url": r[9],
                "video_url": r[10],
                "created_at": r[11].isoformat() if r[11] else "",
            })

        return {"statusCode": 200, "headers": cors, "body": json.dumps({"videos": videos})}

    # POST /videos — загрузка нового видео
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        title = body.get("title", "Без названия")
        channel = body.get("channel", "Аноним")
        description = body.get("description", "")
        category = body.get("category", "Без категории")
        video_b64 = body.get("video_data", "")
        thumb_b64 = body.get("thumb_data", "")
        video_ext = body.get("video_ext", "mp4")
        thumb_ext = body.get("thumb_ext", "jpg")

        s3 = get_s3()
        key_id = os.environ["AWS_ACCESS_KEY_ID"]
        cdn_base = f"https://cdn.poehali.dev/projects/{key_id}/bucket"

        video_key = f"videos/{uuid.uuid4()}.{video_ext}"
        video_bytes = base64.b64decode(video_b64)
        s3.put_object(
            Bucket="files",
            Key=video_key,
            Body=video_bytes,
            ContentType=f"video/{video_ext}",
        )
        video_url = f"{cdn_base}/{video_key}"

        thumb_url = ""
        if thumb_b64:
            thumb_key = f"thumbs/{uuid.uuid4()}.{thumb_ext}"
            thumb_bytes = base64.b64decode(thumb_b64)
            s3.put_object(
                Bucket="files",
                Key=thumb_key,
                Body=thumb_bytes,
                ContentType=f"image/{thumb_ext}",
            )
            thumb_url = f"{cdn_base}/{thumb_key}"

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.videos (title, channel, description, category, video_url, thumb_url) "
            f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (title, channel, description, category, video_url, thumb_url),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"success": True, "id": new_id, "video_url": video_url}),
        }

    return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "Method not allowed"})}
