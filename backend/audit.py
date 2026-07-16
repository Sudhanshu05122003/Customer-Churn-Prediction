import json
from datetime import datetime, timezone
import psycopg2
import psycopg2.extras
import logging

logger = logging.getLogger("churnsense")

def log_audit_action(db_conn, user_id, action, details):
    """
    Log an enterprise audit action to the database.
    """
    try:
        cursor = db_conn.cursor()
        cursor.execute(
            """INSERT INTO audit_logs (timestamp, user_id, action, details)
               VALUES (%s, %s, %s, %s)""",
            (
                datetime.now(timezone.utc).isoformat(),
                user_id,
                action,
                json.dumps(details) if details else None
            )
        )
        db_conn.commit()
        cursor.close()
        logger.info(f"Audit Logged: User {user_id} performed '{action}'")
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}", exc_info=True)
