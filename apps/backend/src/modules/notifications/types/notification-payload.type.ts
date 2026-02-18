import { NotificationType } from '@prisma/client';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: JsonValue;
  sendInApp?: boolean;
  sendEmail?: boolean;
  sendPush?: boolean;
}

export interface EmailNotificationData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, JsonValue>;
}

export interface PushNotificationData {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, JsonValue> | null;
}

export enum NotificationCategory {
  SYSTEM = 'system',
  ACHIEVEMENT = 'achievement',
}

export const NotificationTypeToCategory: Record<
  NotificationType,
  NotificationCategory
> = {
  SYSTEM_ANNOUNCEMENT: NotificationCategory.SYSTEM,
  ACCOUNT_UPDATE: NotificationCategory.SYSTEM,
  RESULT_SUBMISSION: NotificationCategory.SYSTEM,
} as const;
