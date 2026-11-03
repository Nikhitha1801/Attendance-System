import os

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker, declarative_base

# Always backend/attendify.db, no matter which folder uvicorn or seed.py is
# launched from. (A relative path silently created a brand-new empty database
# whenever the server was started from a different directory.)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_DIR, "attendify.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def upgrade_schema():
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    changes = []

    with engine.begin() as connection:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue
            existing_columns = {column["name"] for column in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing_columns:
                    continue
                try:
                    column_type = column.type.compile(dialect=engine.dialect)
                except Exception:
                    column_type = "TEXT"

                default = column.default
                if default is not None and getattr(default, "is_scalar", False):
                    value = default.arg
                    if isinstance(value, bool):
                        default_sql = "1" if value else "0"
                    elif isinstance(value, (int, float)):
                        default_sql = str(value)
                    elif isinstance(value, str):
                        default_sql = "'" + value.replace("'", "''") + "'"
                    else:
                        default_sql = "NULL"
                else:
                    default_sql = "NULL"

                connection.exec_driver_sql(
                    f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" '
                    f"{column_type} DEFAULT {default_sql}"
                )
                changes.append(f"{table.name}.{column.name}")
                existing_columns.add(column.name)

    return changes


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
