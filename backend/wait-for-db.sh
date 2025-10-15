#!/bin/sh


# # Wait until Postgres is ready
# echo "Waiting for postgres..."

# until nc -z db 5432; do
#   sleep 1
# done

# echo "Postgres is up!"

# # Generate Prisma client now, after DB is ready
# echo "Running prisma generate"
# npx prisma generate
# # echo "Running prisma migrate"
# # # เอาใช้ช่วงแรกๆก่อนเพราะเปลีย่น db เยอะ
# # # npx prisma migrate reset
# npx prisma migrate dev --name init
# # # npx prisma migrate deploy


# echo "Running seed script"
# node prisma/seed.js


# # Run your app
# exec "$@"



echo "Waiting for postgres..."
until nc -z db 5432; do
  sleep 1
done
echo "Postgres is up!"



# ให้สิทธิ์ migrations ก่อน (กันปัญหา permission denied)
# chown -R node:node prisma/migrations || true

# echo "Cleaning old migrations..."
# rm -rf prisma/migrations/* || true

echo "Generating Prisma client..."  
npx prisma generate


# echo "Resetting database..."
# npx prisma migrate reset --force


echo "Creating fresh migration..."
npx prisma migrate dev --name init --skip-seed

echo "Running seed script..."
node prisma/seed.js


# Run your app
exec "$@"

