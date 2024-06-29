/*
  Warnings:

  - You are about to alter the column `planId` on the `PaymentPlan` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `PaymentPlan` MODIFY `planId` INTEGER NOT NULL;
