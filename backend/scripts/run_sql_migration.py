import os
import sys
from pathlib import Path

import psycopg2


def load_env_file(path: Path) -> None:
  if not path.exists():
    return

  for raw_line in path.read_text().splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
      continue
    key, value = line.split("=", 1)
    key = key.strip()
    value = value.strip().strip('"').strip("'")
    os.environ.setdefault(key, value)


def main() -> int:
  if len(sys.argv) < 2:
    print("usage: python3 backend/scripts/run_sql_migration.py <sql-file> [--env-file path] [--verify-online-exam-translations]")
    return 1

  sql_file_arg = sys.argv[1]
  extra_args = sys.argv[2:]
  env_file = None
  if "--env-file" in extra_args:
    env_index = extra_args.index("--env-file")
    try:
      env_file = Path(extra_args[env_index + 1])
    except IndexError:
      print("missing_env_file_path")
      return 1
    del extra_args[env_index:env_index + 2]

  if env_file:
    load_env_file(env_file)

  sql_path = Path(sql_file_arg)
  if not sql_path.exists():
    print(f"sql_file_not_found: {sql_path}")
    return 1

  conn = psycopg2.connect(
    host=os.environ["DB_HOST"],
    port=os.environ["DB_PORT"],
    dbname=os.environ["DB_NAME"],
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
  )

  try:
    with conn:
      with conn.cursor() as cur:
        cur.execute(sql_path.read_text())
    print("migration_applied")

    if "--verify-online-exam-translations" in extra_args:
      with conn.cursor() as cur:
        cur.execute(
          """
          SELECT table_name, column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name IN ('online_exams', 'exam_questions')
            AND column_name IN (
              'title_translations',
              'instructions_translations',
              'question_text_translations',
              'option_translations',
              'explanation_translations'
            )
          ORDER BY table_name, column_name
          """
        )
        for table_name, column_name in cur.fetchall():
          print(f"{table_name}.{column_name}")
  finally:
    conn.close()

  return 0


if __name__ == "__main__":
  raise SystemExit(main())
