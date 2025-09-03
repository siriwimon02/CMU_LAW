#!/bin/sh

# Wait until Postgres is ready
echo "Waiting for postgres..."

until nc -z db 5432; do
  sleep 1
done

echo "Postgres is up!"

# Generate Prisma client now, after DB is ready
echo "Running prisma generate"
npx prisma generate

echo "Running prisma migrate"
# npx prisma migrate dev --name init
npx prisma migrate deploy



echo "Running seed script"
node prisma/seed.js


# Run your app
exec "$@"

