-- CreateEnum
CREATE TYPE "ERole" AS ENUM ('ADMIN', 'STUDENT', 'PARENT', 'SCHOOL');

-- CreateEnum
CREATE TYPE "ELevelOfStudy" AS ENUM ('NURSERY', 'PRIMARY', 'OLEVEL', 'ALEVEL', 'UNIVERSITY');

-- CreateEnum
CREATE TYPE "EPaymentMethod" AS ENUM ('AIRTEL', 'MTN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "email" TEXT,
    "username" TEXT,
    "phone" TEXT,
    "uniqueId" TEXT,
    "names" TEXT NOT NULL,
    "levelOfStudy" "ELevelOfStudy",
    "country" TEXT,
    "countryCode" TEXT,
    "password" TEXT,
    "refreshToken" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "role" "ERole" NOT NULL DEFAULT 'STUDENT',
    "schoolId" INTEGER,
    "parentId" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "referenceCode" TEXT NOT NULL,
    "paymentMethod" "EPaymentMethod" NOT NULL,
    "payerId" INTEGER,
    "payeeId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_uniqueId_key" ON "User"("uniqueId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
