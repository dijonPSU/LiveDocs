/*
  Warnings:

  - Added the required column `versionNumber` to the `Version` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Version" ADD COLUMN     "isSnapshot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "versionNumber" INTEGER NOT NULL;
