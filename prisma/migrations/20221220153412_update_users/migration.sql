/*
  Warnings:

  - You are about to drop the column `levelOfStudy` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `uniqueId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[regNo]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_uniqueId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "levelOfStudy",
DROP COLUMN "uniqueId",
ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "regNo" TEXT,
ADD COLUMN     "schoolCode" TEXT;

-- DropEnum
DROP TYPE "ELevelOfStudy";

-- CreateIndex
CREATE UNIQUE INDEX "User_regNo_key" ON "User"("regNo");

-- CreateIndex
CREATE UNIQUE INDEX "User_schoolCode_key" ON "User"("schoolCode");
