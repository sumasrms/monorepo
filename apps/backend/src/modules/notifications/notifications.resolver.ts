import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { roles } from 'lib/permissions';
import { Roles } from '../../common/auth/roles.decorator';
import { NotificationsService } from './notifications.service';
import type { AuthenticatedRequest } from '../../common/auth/auth.guard';
import {
  Notification,
  NotificationSettings,
  FcmToken,
} from './entities/notification.entity';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { FcmTokenParamDto } from './dto/fcm-token-param.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SubmitSupportFeedbackDto } from './dto/submit-support-feedback.dto';

@Resolver(() => Notification)
@UseGuards(AuthGuard, RolesGuard)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  private requireUserId(context: GqlContext): string {
    const req = context.req ?? context.request;
    const userId = req?.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return userId;
  }

  @Query(() => [Notification])
  async notifications(
    @Context() context: GqlContext,
    @Args('query', { type: () => GetNotificationsQueryDto, nullable: true })
    query?: GetNotificationsQueryDto,
  ) {
    const userId = this.requireUserId(context);
    return this.notificationsService.getNotifications(
      userId,
      query?.limit ?? 20,
      query?.offset ?? 0,
    );
  }

  @Query(() => Int)
  async notificationUnreadCount(@Context() context: GqlContext) {
    const userId = this.requireUserId(context);
    const result = await this.notificationsService.getUnreadCount(userId);
    return result.count;
  }

  @Mutation(() => Notification)
  async markNotificationAsRead(
    @Context() context: GqlContext,
    @Args('id') id: string,
  ) {
    const userId = this.requireUserId(context);
    return this.notificationsService.markAsRead(id, userId);
  }

  @Mutation(() => Boolean)
  async markAllNotificationsAsRead(@Context() context: GqlContext) {
    const userId = this.requireUserId(context);
    await this.notificationsService.markAllAsRead(userId);
    return true;
  }

  @Mutation(() => Boolean)
  async deleteNotification(
    @Context() context: GqlContext,
    @Args('id') id: string,
  ) {
    const userId = this.requireUserId(context);
    await this.notificationsService.deleteNotification(id, userId);
    return true;
  }

  @Query(() => NotificationSettings)
  async notificationSettings(@Context() context: GqlContext) {
    const userId = this.requireUserId(context);
    return this.notificationsService.getNotificationSettings(userId);
  }

  @Mutation(() => NotificationSettings)
  async updateNotificationSettings(
    @Context() context: GqlContext,
    @Args('input') input: UpdateNotificationSettingsDto,
  ) {
    const userId = this.requireUserId(context);
    return this.notificationsService.updateNotificationSettings(userId, input);
  }

  @Mutation(() => FcmToken)
  async registerFcmToken(
    @Context() context: GqlContext,
    @Args('input') input: RegisterFcmTokenDto,
  ) {
    const userId = this.requireUserId(context);
    return this.notificationsService.registerFcmToken(userId, input);
  }

  @Mutation(() => Boolean)
  async removeFcmToken(
    @Context() context: GqlContext,
    @Args('input') input: FcmTokenParamDto,
  ) {
    const userId = this.requireUserId(context);
    await this.notificationsService.removeFcmToken(input.token, userId);
    return true;
  }

  @Query(() => [FcmToken])
  async userFcmTokens(@Context() context: GqlContext) {
    const userId = this.requireUserId(context);
    return this.notificationsService.getUserFcmTokens(userId);
  }

  @Mutation(() => Boolean)
  async submitSupportFeedback(
    @Context() context: GqlContext,
    @Args('input') input: SubmitSupportFeedbackDto,
  ) {
    const userId = this.requireUserId(context);
    await this.notificationsService.submitSupportFeedback(userId, input);
    return true;
  }

  @Mutation(() => Boolean)
  @Roles(roles.ADMIN)
  async sendNotification(@Args('input') input: SendNotificationDto) {
    const data = input.data;
    await this.notificationsService.sendNotification({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data,
      sendInApp: input.sendInApp,
      sendEmail: input.sendEmail,
      sendPush: input.sendPush,
    });
    return true;
  }
}

type GqlContext = {
  req?: AuthenticatedRequest;
  request?: AuthenticatedRequest;
};
