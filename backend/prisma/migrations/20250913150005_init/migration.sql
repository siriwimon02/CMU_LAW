-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "rId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Department" (
    "id" SERIAL NOT NULL,
    "department_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleOfUser" (
    "id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,

    CONSTRAINT "RoleOfUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" SERIAL NOT NULL,
    "permission" VARCHAR(255) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" SERIAL NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentPetition" (
    "id" SERIAL NOT NULL,
    "id_doc" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "destinationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "authorize_to" VARCHAR(255) NOT NULL,
    "position" VARCHAR(255) NOT NULL,
    "affiliation" VARCHAR(255) NOT NULL,
    "authorize_text" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_of_signing" TIMESTAMP(3),

    CONSTRAINT "DocumentPetition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Status" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Destination" (
    "id" SERIAL NOT NULL,
    "des_name" TEXT NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentActionsLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "docId" INTEGER NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "time_act" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "node_text" TEXT NOT NULL,

    CONSTRAINT "DocumentActionsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentAttachment" (
    "id" SERIAL NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "docId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "time_upload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentStatusHistory" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "changeById" INTEGER NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note_t" TEXT NOT NULL,

    CONSTRAINT "DocumentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Department_department_name_key" ON "public"."Department"("department_name");

-- CreateIndex
CREATE UNIQUE INDEX "RoleOfUser_role_name_key" ON "public"."RoleOfUser"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "Status_status_key" ON "public"."Status"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_des_name_key" ON "public"."Destination"("des_name");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_rId_fkey" FOREIGN KEY ("rId") REFERENCES "public"."RoleOfUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."RoleOfUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetition" ADD CONSTRAINT "DocumentPetition_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetition" ADD CONSTRAINT "DocumentPetition_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "public"."Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetition" ADD CONSTRAINT "DocumentPetition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetition" ADD CONSTRAINT "DocumentPetition_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentActionsLog" ADD CONSTRAINT "DocumentActionsLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentActionsLog" ADD CONSTRAINT "DocumentActionsLog_docId_fkey" FOREIGN KEY ("docId") REFERENCES "public"."DocumentPetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentAttachment" ADD CONSTRAINT "DocumentAttachment_docId_fkey" FOREIGN KEY ("docId") REFERENCES "public"."DocumentPetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentAttachment" ADD CONSTRAINT "DocumentAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentStatusHistory" ADD CONSTRAINT "DocumentStatusHistory_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."DocumentPetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentStatusHistory" ADD CONSTRAINT "DocumentStatusHistory_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentStatusHistory" ADD CONSTRAINT "DocumentStatusHistory_changeById_fkey" FOREIGN KEY ("changeById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
