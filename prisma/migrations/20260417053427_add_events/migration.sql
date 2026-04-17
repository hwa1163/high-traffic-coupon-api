-- CreateTable
CREATE TABLE `events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `totalQuantity` INTEGER NOT NULL,
    `remainingQuantity` INTEGER NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `events_createdAt_idx`(`createdAt`),
    INDEX `events_startAt_endAt_idx`(`startAt`, `endAt`),
    INDEX `events_remainingQuantity_idx`(`remainingQuantity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
