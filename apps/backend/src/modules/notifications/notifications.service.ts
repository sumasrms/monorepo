import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationSettings, NotificationType, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { SubmitSupportFeedbackDto } from './dto/submit-support-feedback.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import {
  NotificationCategory,
  NotificationPayload,
  NotificationTypeToCategory,
} from './types/notification-payload.type';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async submitSupportFeedback(userId: string, input: SubmitSupportFeedbackDto) {
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!sender) {
      throw new NotFoundException('User not found');
    }

    const adminUsers = await this.prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
      },
      select: { id: true },
    });

    const titlePrefix = input.type === 'SUPPORT' ? 'Support' : 'Feedback';
    const adminTitle = `${titlePrefix} Request: ${input.subject}`;
    const adminMessage = input.message;

    const payloadData = {
      source: 'support-feedback',
      requestType: input.type,
      category: input.category,
      priority: input.priority,
      subject: input.subject,
      message: input.message,
      ...(input.portalType ? { portalType: input.portalType } : {}),
      ...(input.currentPath ? { currentPath: input.currentPath } : {}),
      sender: {
        id: sender.id,
        name: sender.name,
        email: sender.email,
        role: sender.role,
      },
    };

    await this.prisma.$transaction(async (tx) => {
      if (adminUsers.length > 0) {
        await tx.notification.createMany({
          data: adminUsers.map((admin) => ({
            userId: admin.id,
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: adminTitle,
            message: adminMessage,
            data: payloadData as Prisma.InputJsonValue,
          })),
        });
      }

      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.ACCOUNT_UPDATE,
          title: `${titlePrefix} submitted`,
          message:
            'Your request has been received and routed to administrators.',
          data: {
            source: 'support-feedback',
            requestType: input.type,
            category: input.category,
            priority: input.priority,
            subject: input.subject,
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  async sendNotification(payload: NotificationPayload) {
    try {
      await this.notificationQueue.add('send-notification', payload, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log(
        `Notification queued for user ${payload.userId}: ${payload.type}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to queue notification: ${message}`);
    }
  }

  async processNotification(payload: NotificationPayload) {
    const settings = await this.getNotificationSettings(payload.userId);
    const category = NotificationTypeToCategory[payload.type];

    const shouldSendInApp = this.shouldSendInApp(
      category,
      settings,
      payload.sendInApp,
    );
    const shouldSendEmail = this.shouldSendEmail(
      category,
      settings,
      payload.sendEmail,
    );
    const shouldSendPush = this.shouldSendPush(
      category,
      settings,
      payload.sendPush,
    );

    if (shouldSendInApp) {
      await this.createInAppNotification(payload);
    }

    if (shouldSendEmail) {
      await this.queueEmailNotification(payload);
    }

    if (shouldSendPush) {
      await this.queuePushNotification(payload);
    }
  }

  private async createInAppNotification(payload: NotificationPayload) {
    try {
      const data =
        payload.data === undefined || payload.data === null
          ? Prisma.JsonNull
          : (payload.data as Prisma.InputJsonValue);

      await this.prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data,
        },
      });

      this.logger.log(`In-app notification created for user ${payload.userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create in-app notification: ${message}`);
    }
  }

  private async queueEmailNotification(payload: NotificationPayload) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (!user) {
        this.logger.warn(
          `User ${payload.userId} not found for email notification`,
        );
        return;
      }

      await this.notificationQueue.add(
        'send-email',
        {
          to: user.email,
          subject: payload.title,
          template: this.getEmailTemplate(payload.type),
          context: {
            name: user.firstName || user.email,
            title: payload.title,
            message: payload.message,
            data: payload.data,
          },
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      this.logger.log(`Email notification queued for user ${payload.userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to queue email notification: ${message}`);
    }
  }

  private async queuePushNotification(payload: NotificationPayload) {
    try {
      const tokens = await this.prisma.fcmToken.findMany({
        where: { userId: payload.userId },
        select: { token: true },
      });

      if (tokens.length === 0) {
        this.logger.debug(`No FCM tokens found for user ${payload.userId}`);
        return;
      }

      await this.notificationQueue.add(
        'send-push',
        {
          tokens: tokens.map((t) => t.token),
          title: payload.title,
          body: payload.message,
          data: payload.data,
        },
        {
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 3000,
          },
        },
      );

      this.logger.log(
        `Push notification queued for ${tokens.length} devices of user ${payload.userId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to queue push notification: ${message}`);
    }
  }

  private shouldSendInApp(
    category: NotificationCategory,
    settings: NotificationSettings,
    override?: boolean,
  ): boolean {
    if (override !== undefined) return override;

    switch (category) {
      case NotificationCategory.SYSTEM:
        return settings.systemInApp;
      default:
        return true;
    }
  }

  private shouldSendEmail(
    category: NotificationCategory,
    settings: NotificationSettings,
    override?: boolean,
  ): boolean {
    if (override !== undefined) return override;

    switch (category) {
      case NotificationCategory.SYSTEM:
        return settings.systemEmail;
      default:
        return false;
    }
  }

  private shouldSendPush(
    category: NotificationCategory,
    settings: NotificationSettings,
    override?: boolean,
  ): boolean {
    if (override !== undefined) return override;
    return this.shouldSendInApp(category, settings);
  }

  private getEmailTemplate(type: NotificationType): string {
    const templateMap: Record<NotificationType, string> = {
      SYSTEM_ANNOUNCEMENT: 'system-announcement',
      ACCOUNT_UPDATE: 'account-update',
      RESULT_SUBMISSION: 'result-submission',
    };

    return templateMap[type] || 'notification';
  }

  async getNotificationSettings(userId: string) {
    let settings = await this.prisma.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.notificationSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateNotificationSettings(
    userId: string,
    dto: UpdateNotificationSettingsDto,
  ) {
    const settings = await this.getNotificationSettings(userId);

    return this.prisma.notificationSettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }

  async getNotifications(userId: string, limit = 50, offset = 0) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }

  async registerFcmToken(userId: string, dto: RegisterFcmTokenDto) {
    const existing = await this.prisma.fcmToken.findUnique({
      where: { token: dto.token },
    });

    if (existing) {
      return this.prisma.fcmToken.update({
        where: { token: dto.token },
        data: {
          userId,
          deviceId: dto.deviceId,
          platform: dto.platform,
        },
      });
    }

    return this.prisma.fcmToken.create({
      data: {
        userId,
        token: dto.token,
        deviceId: dto.deviceId,
        platform: dto.platform,
      },
    });
  }

  async removeFcmToken(token: string, userId: string) {
    const fcmToken = await this.prisma.fcmToken.findUnique({
      where: { token },
    });

    if (!fcmToken || fcmToken.userId !== userId) {
      throw new NotFoundException('FCM token not found');
    }

    await this.prisma.fcmToken.delete({
      where: { token },
    });

    return { message: 'FCM token removed successfully' };
  }

  async getUserFcmTokens(userId: string) {
    return this.prisma.fcmToken.findMany({
      where: { userId },
    });
  }
}
