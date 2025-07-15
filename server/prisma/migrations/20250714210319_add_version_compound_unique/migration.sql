/*
  Warnings:

  - A unique constraint covering the columns `[documentId,versionNumber]` on the table `Version` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Version_documentId_versionNumber_key" ON "Version"("documentId", "versionNumber");
