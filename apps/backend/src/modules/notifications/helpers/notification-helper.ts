import { NotificationType } from '@prisma/client';

export interface NotificationHelper {
  sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ): Promise<void>;
}
