# FROM node:20-alpine
# WORKDIR /app

# # ติดตั้ง libreoffice + dependency ที่จำเป็น
# RUN apk add --no-cache \
#     libreoffice \
#     openjdk11 \
#     ttf-freefont \
#     fontconfig \
#     bash \
#     && rm -rf /var/cache/apk/*

# # Install dependencies
# COPY package*.json ./
# RUN npm ci

# # Prisma setup
# COPY prisma ./prisma
# RUN npx prisma generate

# # Copy rest of the code
# COPY . .

# # Wait-for script
# COPY wait-for-db.sh ./wait-for-db.sh
# RUN chmod +x ./wait-for-db.sh

# EXPOSE 3001

# # Wait for DB, then run server
# ENTRYPOINT ["./wait-for-db.sh"]
# CMD ["npx", "nodemon", "index.js"]


FROM node:20-alpine
WORKDIR /app

# 1) LibreOffice + fontconfig + ฟอนต์พื้นฐาน + เครื่องมือที่ขาด
# - netcat-openbsd: ให้สคริปต์ wait-for-db.sh ใช้ `nc`
# - postgresql-client: ถ้าอยากใช้ `pg_isready` แทน nc ก็ได้
RUN apk add --no-cache \
    libreoffice \
    fontconfig \
    ttf-dejavu \
    ttf-freefont \
    bash \
    netcat-openbsd \
    postgresql-client

# 2) คัดลอกฟอนต์ TH Sarabun PSK (มีช่องว่างในชื่อโฟลเดอร์ -> ใช้รูปแบบ JSON)
#    จะก็อปทั้งโฟลเดอร์เข้าไปที่ /usr/local/share/fonts/THSarabunPSK/
COPY ["fonts/TH Sarabun PSK V-1/", "/usr/local/share/fonts/THSarabunPSK/"]

# (ออปชัน) alias กันชื่อฟอนต์คลาดเคลื่อนใน template
# COPY ["fonts/fonts.conf", "/etc/fonts/local.conf"]

# อัปเดต font cache (สำคัญมาก)
RUN fc-cache -f -v


# 4) ติดตั้ง dependencies แอป
COPY package*.json ./
# ใช้ npm ci (รวม devDependencies เพื่อมี nodemon ตามที่คุณใช้)
RUN npm ci

# 5) Prisma
COPY prisma ./prisma
RUN npx prisma generate

# 6) โค้ดแอป
COPY . .

# 7) โฟลเดอร์ผลลัพธ์ให้แอปเขียนไฟล์ได้
RUN mkdir -p /app/generate

EXPOSE 3001

# (ออปชัน) healthcheck ว่า LibreOffice พร้อม
# HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
#   CMD soffice --headless --version || exit 1

# รอ DB ก่อน แล้วค่อยรันแอป (มีไฟล์ wait-for-db.sh อยู่แล้ว)
ENTRYPOINT ["./wait-for-db.sh"]
CMD ["npx", "nodemon", "index.js"]

