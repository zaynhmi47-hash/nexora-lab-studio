from django.db import connection
from django.db.utils import DatabaseError


def check_database_connection() -> bool:
    """Return whether the configured database accepts a trivial read query."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            return cursor.fetchone() == (1,)
    except DatabaseError:
        return False
