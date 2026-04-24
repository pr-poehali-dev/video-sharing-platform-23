"""
Google OAuth авторизация: верификация id_token и upsert пользователя в БД.
"""
import os
import json
import psycopg2
import urllib.request
import urllib.error

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def verify_google_token(id_token: str) -> dict:
    """Верифицирует Google id_token через публичный эндпоинт Google."""
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    body = json.loads(event.get("body") or "{}")
    id_token = body.get("id_token", "")

    if not id_token:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "id_token обязателен"})}

    try:
        payload = verify_google_token(id_token)
    except urllib.error.HTTPError:
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Недействительный токен Google"})}

    # Проверяем audience (Client ID)
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    if client_id and payload.get("aud") != client_id:
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Токен не для этого приложения"})}

    google_id = payload.get("sub", "")
    email = payload.get("email", "")
    name = payload.get("name", email)
    avatar_url = payload.get("picture", "")

    if not google_id or not email:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Не удалось получить данные профиля"})}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"""
        INSERT INTO {SCHEMA}.users (google_id, email, name, avatar_url)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (google_id) DO UPDATE
            SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
        RETURNING id, google_id, email, name, avatar_url
        """,
        (google_id, email, name, avatar_url),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    user = {
        "id": row[0],
        "google_id": row[1],
        "email": row[2],
        "name": row[3],
        "avatar_url": row[4],
    }

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({"success": True, "user": user}),
    }
