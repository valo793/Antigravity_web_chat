CREATE TABLE `agents` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`sourceType` enum('antigravity','manual','api') NOT NULL DEFAULT 'antigravity',
	`isActive` boolean NOT NULL DEFAULT true,
	`webhookSecret` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` varchar(64) NOT NULL,
	`messageId` varchar(64) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` bigint NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`s3Url` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`externalThreadId` varchar(255),
	`agentId` varchar(64),
	`lastMessageAt` timestamp,
	`unreadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(64) NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`senderType` enum('user','agent','system') NOT NULL,
	`senderLabel` varchar(255),
	`content` text NOT NULL,
	`contentFormat` enum('text','markdown','json_excerpt') NOT NULL DEFAULT 'text',
	`externalMessageId` varchar(255),
	`status` enum('received','processed','failed') NOT NULL DEFAULT 'received',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`conversationId` varchar(64),
	`messageId` varchar(64),
	`title` varchar(255) NOT NULL,
	`body` text,
	`kind` enum('new_message','agent_error','system','new_conversation') NOT NULL DEFAULT 'new_message',
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`userId` int NOT NULL,
	`theme` enum('light','dark') NOT NULL DEFAULT 'light',
	`notificationSound` boolean NOT NULL DEFAULT true,
	`desktopToastEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `webhookEvents` (
	`id` varchar(64) NOT NULL,
	`source` varchar(64) NOT NULL,
	`eventId` varchar(255) NOT NULL,
	`signatureValid` boolean NOT NULL DEFAULT false,
	`payload` json,
	`processingStatus` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agents_slug_idx` ON `agents` (`slug`);--> statement-breakpoint
CREATE INDEX `attachments_messageId_idx` ON `attachments` (`messageId`);--> statement-breakpoint
CREATE INDEX `conversations_userId_idx` ON `conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `conversations_externalThreadId_idx` ON `conversations` (`externalThreadId`);--> statement-breakpoint
CREATE INDEX `conversations_lastMessageAt_idx` ON `conversations` (`lastMessageAt`);--> statement-breakpoint
CREATE INDEX `messages_conversationId_idx` ON `messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `messages_createdAt_idx` ON `messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `messages_externalMessageId_idx` ON `messages` (`externalMessageId`);--> statement-breakpoint
CREATE INDEX `notifications_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_isRead_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `notifications_createdAt_idx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `webhookEvents_eventId_idx` ON `webhookEvents` (`eventId`);--> statement-breakpoint
CREATE INDEX `webhookEvents_source_idx` ON `webhookEvents` (`source`);