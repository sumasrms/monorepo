import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SystemSettings } from './entities/system-settings.entity';
import {
  UpdateSettingInput,
  GetSettingInput,
  GetSettingsByCategoryInput,
} from './dto/settings.input';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';

@Resolver(() => SystemSettings)
@UseGuards(AuthGuard, RolesGuard)
export class SettingsResolver {
  constructor(private readonly settingsService: SettingsService) {}

  @Query(() => SystemSettings, { nullable: true, name: 'getSetting' })
  @Roles('admin')
  async getSetting(@Args('input') input: GetSettingInput) {
    return this.settingsService.getSetting(input.key);
  }

  @Query(() => [SystemSettings], { name: 'getSettingsByCategory' })
  @Roles('admin')
  async getSettingsByCategory(
    @Args('input') input: GetSettingsByCategoryInput,
  ) {
    return this.settingsService.getSettingsByCategory(input.category);
  }

  @Query(() => [SystemSettings], { name: 'getAllSettings' })
  @Roles('admin')
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Mutation(() => SystemSettings, { name: 'updateSetting' })
  @Roles('admin')
  async updateSetting(@Args('input') input: UpdateSettingInput) {
    return this.settingsService.updateSetting(input);
  }

  @Mutation(() => [SystemSettings], { name: 'updateMultipleSettings' })
  @Roles('admin')
  async updateMultipleSettings(
    @Args({ name: 'inputs', type: () => [UpdateSettingInput] })
    inputs: UpdateSettingInput[],
  ) {
    return this.settingsService.updateMultipleSettings(inputs);
  }

  @Mutation(() => SystemSettings, { name: 'deleteSetting' })
  @Roles('admin')
  async deleteSetting(@Args('key') key: string) {
    return this.settingsService.deleteSetting(key);
  }

  @Mutation(() => Boolean, { name: 'resetSettingsCategory' })
  @Roles('admin')
  async resetCategory(@Args('category') category: string) {
    await this.settingsService.resetCategory(category);
    return true;
  }
}
