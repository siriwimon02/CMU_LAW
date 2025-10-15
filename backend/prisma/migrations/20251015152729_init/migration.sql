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
CREATE TABLE "public"."DocumentPetition" (
    "id" SERIAL NOT NULL,
    "id_doc" VARCHAR(255),
    "departmentId" INTEGER NOT NULL,
    "destinationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "authorize_to" VARCHAR(255) NOT NULL,
    "position" VARCHAR(255) NOT NULL,
    "affiliation" VARCHAR(255) NOT NULL,
    "authorize_text" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "auditIdBy" INTEGER,
    "headauditIdBy" INTEGER,
    "statusId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_number" TEXT,
    "date_of_signing" TIMESTAMP(3),

    CONSTRAINT "DocumentPetition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RequiredDocument" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "RequiredDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentNeed" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "requiredDocumentId" INTEGER NOT NULL,
    "isProvided" BOOLEAN NOT NULL DEFAULT false,
    "providedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Status" (
    "id" SERIAL NOT NULL,
    "status" VARCHAR(255) NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Destination" (
    "id" SERIAL NOT NULL,
    "des_name" TEXT NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttachmentType" (
    "id" SERIAL NOT NULL,
    "type_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "AttachmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentAttachment" (
    "id" SERIAL NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "docId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "attachment_typeId" INTEGER NOT NULL,
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
    "note_text" TEXT,

    CONSTRAINT "DocumentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentPetitionHistory" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "authorize_to" VARCHAR(255) NOT NULL,
    "position" VARCHAR(255) NOT NULL,
    "affiliation" VARCHAR(255) NOT NULL,
    "authorize_text" TEXT NOT NULL,
    "editById" INTEGER NOT NULL,
    "editAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "his_statusId" INTEGER NOT NULL,
    "note_text" TEXT,

    CONSTRAINT "DocumentPetitionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentPetitionHistoryTranfers" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "transferFromId" INTEGER NOT NULL,
    "transferToId" INTEGER NOT NULL,
    "transferById" INTEGER NOT NULL,
    "his_statusId" INTEGER NOT NULL,
    "note_text" TEXT,

    CONSTRAINT "DocumentPetitionHistoryTranfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Department_department_name_key" ON "public"."Department"("department_name");

-- CreateIndex
CREATE UNIQUE INDEX "RoleOfUser_role_name_key" ON "public"."RoleOfUser"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPetition_id_doc_key" ON "public"."DocumentPetition"("id_doc");

-- CreateIndex
CREATE INDEX "DocumentPetition_departmentId_idx" ON "public"."DocumentPetition"("departmentId");

-- CreateIndex
CREATE INDEX "DocumentPetition_destinationId_idx" ON "public"."DocumentPetition"("destinationId");

-- CreateIndex
CREATE INDEX "DocumentPetition_userId_idx" ON "public"."DocumentPetition"("userId");

-- CreateIndex
CREATE INDEX "DocumentPetition_auditIdBy_idx" ON "public"."DocumentPetition"("auditIdBy");

-- CreateIndex
CREATE INDEX "DocumentPetition_headauditIdBy_idx" ON "public"."DocumentPetition"("headauditIdBy");

-- CreateIndex
CREATE INDEX "DocumentPetition_statusId_idx" ON "public"."DocumentPetition"("statusId");

-- CreateIndex
CREATE INDEX "DocumentPetition_createdAt_idx" ON "public"."DocumentPetition"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RequiredDocument_name_key" ON "public"."RequiredDocument"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Status_status_key" ON "public"."Status"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_des_name_key" ON "public"."Destination"("des_name");

-- CreateIndex
CREATE UNIQUE INDEX "AttachmentType_type_name_key" ON "public"."AttachmentType"("type_name");

-- CreateIndex
CREATE INDEX "DocumentAttachment_attachment_typeId_idx" ON "public"."DocumentAttachment"("attachment_typeId");

-- CreateIndex
CREATE INDEX "DocumentAttachment_docId_idx" ON "public"."DocumentAttachment"("docId");

-- CreateIndex
CREATE INDEX "DocumentAttachment_userId_idx" ON "public"."DocumentAttachment"("userId");

-- CreateIndex
CREATE INDEX "DocumentStatusHistory_documentId_idx" ON "public"."DocumentStatusHistory"("documentId");

-- CreateIndex
CREATE INDEX "DocumentStatusHistory_statusId_idx" ON "public"."DocumentStatusHistory"("statusId");

-- CreateIndex
CREATE INDEX "DocumentStatusHistory_changeById_idx" ON "public"."DocumentStatusHistory"("changeById");

-- CreateIndex
CREATE INDEX "DocumentStatusHistory_changedAt_idx" ON "public"."DocumentStatusHistory"("changedAt");

-- CreateIndex
CREATE INDEX "DocumentPetitionHistory_documentId_idx" ON "public"."DocumentPetitionHistory"("documentId");

-- CreateIndex
CREATE INDEX "DocumentPetitionHistory_editById_idx" ON "public"."DocumentPetitionHistory"("editById");

-- CreateIndex
CREATE INDEX "DocumentPetitionHistory_editAt_idx" ON "public"."DocumentPetitionHistory"("editAt");

-- CreateIndex
CREATE INDEX "DocumentPetitionHistoryTranfers_documentId_idx" ON "public"."DocumentPetitionHistoryTranfers"("documentId");

-- CreateIndex
CREATE INDEX "DocumentPetitionHistoryTranfers_transferFromId_idx" ON "public"."DocumentPetitionHistoryTranfers"("transferFromId");

-- CreateIndex
CREATE INDEX "DocumentPetitionHistoryTranfers_transferToId_idx" ON "public"."DocumentPetitionHistoryTranfers"("transferToId");

-- CreateIndex
CREATE INDEX "DocumentPetitionHistoryTranfers_transferById_idx" ON "public"."DocumentPetitionHistoryTranfers"("transferById");

-- CreateIndex
CREATE INDEX "DocumentPetitionHistoryTranfers_his_statusId_idx" ON "public"."DocumentPetitionHistoryTranfers"("his_statusId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_rId_fkey" FOREIGN KEY ("rId") REFERENCES "public"."RoleOfUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetition" ADD CONSTRAINT "DocumentPetition_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetition" ADD CONSTRAINT "DocumentPetition_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "public"."Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetition" ADD CONSTRAINT "DocumentPetition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetition" ADD CONSTRAINT "DocumentPetition_auditIdBy_fkey" FOREIGN KEY ("auditIdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetition" ADD CONSTRAINT "DocumentPetition_headauditIdBy_fkey" FOREIGN KEY ("headauditIdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetition" ADD CONSTRAINT "DocumentPetition_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentNeed" ADD CONSTRAINT "DocumentNeed_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."DocumentPetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentNeed" ADD CONSTRAINT "DocumentNeed_requiredDocumentId_fkey" FOREIGN KEY ("requiredDocumentId") REFERENCES "public"."RequiredDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentAttachment" ADD CONSTRAINT "DocumentAttachment_docId_fkey" FOREIGN KEY ("docId") REFERENCES "public"."DocumentPetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentAttachment" ADD CONSTRAINT "DocumentAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentAttachment" ADD CONSTRAINT "DocumentAttachment_attachment_typeId_fkey" FOREIGN KEY ("attachment_typeId") REFERENCES "public"."AttachmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentStatusHistory" ADD CONSTRAINT "DocumentStatusHistory_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."DocumentPetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentStatusHistory" ADD CONSTRAINT "DocumentStatusHistory_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentStatusHistory" ADD CONSTRAINT "DocumentStatusHistory_changeById_fkey" FOREIGN KEY ("changeById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetitionHistory" ADD CONSTRAINT "DocumentPetitionHistory_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."DocumentPetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetitionHistory" ADD CONSTRAINT "DocumentPetitionHistory_editById_fkey" FOREIGN KEY ("editById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetitionHistory" ADD CONSTRAINT "DocumentPetitionHistory_his_statusId_fkey" FOREIGN KEY ("his_statusId") REFERENCES "public"."DocumentStatusHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetitionHistoryTranfers" ADD CONSTRAINT "DocumentPetitionHistoryTranfers_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."DocumentPetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetitionHistoryTranfers" ADD CONSTRAINT "DocumentPetitionHistoryTranfers_transferFromId_fkey" FOREIGN KEY ("transferFromId") REFERENCES "public"."Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetitionHistoryTranfers" ADD CONSTRAINT "DocumentPetitionHistoryTranfers_transferToId_fkey" FOREIGN KEY ("transferToId") REFERENCES "public"."Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetitionHistoryTranfers" ADD CONSTRAINT "DocumentPetitionHistoryTranfers_transferById_fkey" FOREIGN KEY ("transferById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentPetitionHistoryTranfers" ADD CONSTRAINT "DocumentPetitionHistoryTranfers_his_statusId_fkey" FOREIGN KEY ("his_statusId") REFERENCES "public"."DocumentStatusHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
