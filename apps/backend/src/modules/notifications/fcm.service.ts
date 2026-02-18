import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: admin.app.App | undefined;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const serviceAccountPath = this.configService.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_PATH',
      );

      if (!serviceAccountPath) {
        this.logger.warn(
          'FIREBASE_SERVICE_ACCOUNT_PATH not configured. FCM notifications will be disabled.',
        );
        return;
      }

      const rawServiceAccount = JSON.parse(
        readFileSync(serviceAccountPath, 'utf8'),
      ) as unknown;

      if (!this.isServiceAccount(rawServiceAccount)) {
        this.logger.error(
          'Invalid Firebase service account JSON. FCM notifications will be disabled.',
        );
        return;
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert(rawServiceAccount),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to initialize Firebase Admin SDK: ${message}`);
    }
  }

  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, unknown> | null,
  ): Promise<boolean> {
    if (!this.app) {
      this.logger.warn('FCM not initialized. Skipping push notification.');
      return false;
    }

    try {
      const normalizedData = this.normalizeData(data);
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        ...(normalizedData ? { data: normalizedData } : {}),
        token,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent message: ${response}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending FCM message: ${message}`);
      return false;
    }
  }

  async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown> | null,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.app) {
      this.logger.warn('FCM not initialized. Skipping push notifications.');
      return { successCount: 0, failureCount: tokens.length };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const normalizedData = this.normalizeData(data);
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        ...(normalizedData ? { data: normalizedData } : {}),
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(
        `Successfully sent ${response.successCount} messages, ${response.failureCount} failed`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending multicast FCM message: ${message}`);
      return { successCount: 0, failureCount: tokens.length };
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, unknown> | null,
  ): Promise<boolean> {
    if (!this.app) {
      this.logger.warn('FCM not initialized. Skipping push notification.');
      return false;
    }

    try {
      const normalizedData = this.normalizeData(data);
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        ...(normalizedData ? { data: normalizedData } : {}),
        topic,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent message to topic: ${response}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending FCM topic message: ${message}`);
      return false;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
    if (!this.app) {
      this.logger.warn('FCM not initialized. Cannot subscribe to topic.');
      return false;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      this.logger.log(
        `Successfully subscribed ${response.successCount} tokens to topic ${topic}`,
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error subscribing to topic: ${message}`);
      return false;
    }
  }

  async unsubscribeFromTopic(
    tokens: string[],
    topic: string,
  ): Promise<boolean> {
    if (!this.app) {
      this.logger.warn('FCM not initialized. Cannot unsubscribe from topic.');
      return false;
    }

    try {
      const response = await admin
        .messaging()
        .unsubscribeFromTopic(tokens, topic);
      this.logger.log(
        `Successfully unsubscribed ${response.successCount} tokens from topic ${topic}`,
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error unsubscribing from topic: ${message}`);
      return false;
    }
  }

  private normalizeData(
    data?: Record<string, unknown> | null,
  ): Record<string, string> | undefined {
    if (!data) return undefined;

    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        normalized[key] = '';
      } else if (typeof value === 'string') {
        normalized[key] = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        normalized[key] = String(value);
      } else {
        normalized[key] = JSON.stringify(value);
      }
    }

    return normalized;
  }

  private isServiceAccount(value: unknown): value is admin.ServiceAccount {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return (
      typeof record.project_id === 'string' &&
      typeof record.client_email === 'string' &&
      typeof record.private_key === 'string'
    );
  }
}
