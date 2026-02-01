import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateSettingInput } from './dto/settings.input';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(key: string) {
    return this.prisma.systemSettings.findUnique({
      where: { key },
    });
  }

  async getSettingsByCategory(category: string) {
    return this.prisma.systemSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
  }

  async getAllSettings() {
    return this.prisma.systemSettings.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async updateSetting(input: UpdateSettingInput) {
    const { key, value, category } = input;

    // Upsert: update if exists, create if not
    return this.prisma.systemSettings.upsert({
      where: { key },
      update: {
        value,
        ...(category && { category }),
      },
      create: {
        key,
        value,
        category: category || 'general',
      },
    });
  }

  async updateMultipleSettings(inputs: UpdateSettingInput[]) {
    const results = await Promise.all(
      inputs.map((input) => this.updateSetting(input)),
    );
    return results;
  }

  async deleteSetting(key: string) {
    return this.prisma.systemSettings.delete({
      where: { key },
    });
  }

  async resetCategory(category: string) {
    return this.prisma.systemSettings.deleteMany({
      where: { category },
    });
  }
}
