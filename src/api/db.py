"""All database access lives here. Raw SQL on purpose — small app, full control."""
import os
import uuid

import psycopg
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]


def _connect():
    return psycopg.connect(DATABASE_URL)


# ---------- users ----------

def create_user(email: str, password_hash: str, name: str | None) -> dict:
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s) "
            "RETURNING id, email, name",
            (email, password_hash, name),
        )
        row = cur.fetchone()
        conn.commit()
    return {"id": str(row[0]), "email": row[1], "name": row[2]}


def get_user_by_email(email: str) -> dict | None:
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, email, name, password_hash FROM users WHERE email = %s",
            (email,),
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"id": str(row[0]), "email": row[1], "name": row[2], "password_hash": row[3]}


def get_user_by_id(user_id: str) -> dict | None:
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, email, name FROM users WHERE id = %s", (user_id,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"id": str(row[0]), "email": row[1], "name": row[2]}


# ---------- conversations (chat history) ----------

def create_conversation(user_id: str, title: str) -> str:
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO conversations (user_id, title) VALUES (%s, %s) RETURNING id",
            (user_id, title),
        )
        conv_id = str(cur.fetchone()[0])
        conn.commit()
    return conv_id


def list_conversations(user_id: str) -> list[dict]:
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, title, updated_at FROM conversations "
            "WHERE user_id = %s ORDER BY updated_at DESC",
            (user_id,),
        )
        rows = cur.fetchall()
    return [
        {"id": str(r[0]), "title": r[1], "updated_at": r[2].isoformat()} for r in rows
    ]


def get_conversation(user_id: str, conversation_id: str) -> dict | None:
    """Returns the conversation ONLY if it belongs to this user. Security check."""
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, title FROM conversations WHERE id = %s AND user_id = %s",
            (conversation_id, user_id),
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"id": str(row[0]), "title": row[1]}


def touch_conversation(conversation_id: str) -> None:
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "UPDATE conversations SET updated_at = now() WHERE id = %s",
            (conversation_id,),
        )
        conn.commit()


def delete_conversation(user_id: str, conversation_id: str) -> bool:
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM conversations WHERE id = %s AND user_id = %s",
            (conversation_id, user_id),
        )
        deleted = cur.rowcount > 0
        conn.commit()
    return deleted

def list_user_facts(user_id: str) -> list[dict]:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, fact, fact_type, created_at
                FROM user_facts
                WHERE user_id = %s
                ORDER BY created_at DESC
                """,
                (user_id,),
            )

            rows = cur.fetchall()

    return [
        {
            "id": str(row[0]),
            "fact": row[1],
            "fact_type": row[2],
            "created_at": row[3],
        }
        for row in rows
    ]

def add_user_fact(user_id: str, fact: str, fact_type: str | None = None):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id
                FROM user_facts
                WHERE user_id = %s
                  AND LOWER(fact) = LOWER(%s)
                LIMIT 1
                """,
                (user_id, fact),
            )

            existing = cur.fetchone()

            if existing:
                return

            cur.execute(
                """
                INSERT INTO user_facts (user_id, fact, fact_type)
                VALUES (%s, %s, %s)
                """,
                (user_id, fact, fact_type),
            )