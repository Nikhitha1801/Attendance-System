"""
Safely upgrades an existing attendify.db to match the current code's models,
WITHOUT deleting any existing data. Run this instead of seed.py whenever you
pull a code update -- seed.py wipes everything and rebuilds demo data; this
script only adds what's missing (new tables, new columns) and leaves
everything else exactly as it was.

Usage:
    python migrate.py

Safe to run any time, including on a database that's already fully up to
date (it'll just report there's nothing to do).
"""
from app.database import SQLALCHEMY_DATABASE_URL, upgrade_schema
from app import models  # noqa: F401 -- import registers every model on Base

def run():
    print(f"Database: {SQLALCHEMY_DATABASE_URL}")
    changes = upgrade_schema()

    if changes:
        print(f"\nDone -- added {len(changes)} missing column(s)/table(s). Existing data is untouched.")
    else:
        print("\nAlready up to date -- no changes needed.")


if __name__ == "__main__":
    run()
