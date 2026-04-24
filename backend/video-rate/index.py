"""
Оценка видео: лайк или дизлайк по video_id.
"""
import os
import json
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    body = json.loads(event.get("body") or "{}")
    video_id = body.get("video_id")
    rate_type = body.get("type")  # "like" | "dislike"

    if not video_id or rate_type not in ("like", "dislike"):
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "video_id и type обязательны"})}

    field = "likes" if rate_type == "like" else "dislikes"

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.videos SET {field} = {field} + 1 WHERE id = %s RETURNING likes, dislikes",
        (video_id,),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not row:
        return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Видео не найдено"})}

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({"likes": row[0], "dislikes": row[1]}),
    }
