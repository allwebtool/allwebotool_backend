-- AlterTable
ALTER TABLE `PaymentPlan` ADD COLUMN `perk` VARCHAR(191) NULL,
    ADD COLUMN `required_field` BOOLEAN NOT NULL DEFAULT false;
