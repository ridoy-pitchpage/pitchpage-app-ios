#!/usr/bin/env bash
# Run 001_delete_my_account.sql against a throwaway PostgreSQL and check it
# deletes the caller, all of the caller's data, and nobody else's.
#
# The mock schema deliberately gives the page-keyed tables foreign keys with NO
# cascade, so if the function ever deletes in the wrong order Postgres refuses
# and this fails — which is the thing most likely to break when a table is
# added to it. It also leaves several of the tables the function names OUT,
# proving it skips a table the database does not have instead of aborting.
#
#   ./sql/test/run.sh            needs postgres 16 and a `postgres` OS user
set -euo pipefail

BIN=${PG_BIN:-/usr/lib/postgresql/16/bin}
DATA=$(mktemp -d)
PORT=${PG_PORT:-5433}
HERE=$(cd "$(dirname "$0")" && pwd)

chown postgres:postgres "$DATA"
cleanup() { su postgres -c "$BIN/pg_ctl -D $DATA stop -m immediate" >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

su postgres -c "$BIN/initdb -D $DATA -A trust -U postgres" >/dev/null
su postgres -c "$BIN/pg_ctl -D $DATA -l $DATA/log -o '-k /tmp -p $PORT -c listen_addresses=' start" >/dev/null
sleep 1

psql() { su postgres -c "psql -h /tmp -p $PORT -U postgres -v ON_ERROR_STOP=1 -q $*"; }
psql "-f $HERE/mock-schema.sql"
psql "-f $HERE/../001_delete_my_account.sql"
psql "-f $HERE/delete-my-account.test.sql"

echo
echo "Grants (expect t / f / t):"
psql "-c \"SELECT to_regprocedure('public.delete_my_account()') IS NOT NULL AS exists,
  has_function_privilege('anon','public.delete_my_account()','EXECUTE') AS anon_can,
  has_function_privilege('authenticated','public.delete_my_account()','EXECUTE') AS authed_can;\""
