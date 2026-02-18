import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import { AcademicSession } from './entities/academic-session.entity';
import { AcademicSettings } from './entities/academic-settings.entity';
import { CreateSessionInput, UpdateSessionInput } from './dto/session.input';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';
import { Semester } from '@prisma/client';

@Resolver()
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Query(() => [AcademicSession], { name: 'getAllSessions' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(roles.ADMIN, roles.SENATE)
  async getAllSessions() {
    return this.sessionService.getAllSessions();
  }

  @Query(() => AcademicSession, { name: 'getCurrentSession', nullable: true })
  async getCurrentSession() {
    return this.sessionService.getCurrentSession();
  }

  @Query(() => AcademicSettings, {
    name: 'getAcademicSettings',
    nullable: true,
  })
  async getAcademicSettings() {
    return this.sessionService.getAcademicSettings();
  }

  @Mutation(() => AcademicSession, { name: 'createSession' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(roles.ADMIN, roles.SENATE)
  async createSession(@Args('input') input: CreateSessionInput) {
    return this.sessionService.createSession(input);
  }

  @Mutation(() => AcademicSession, { name: 'updateSession' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(roles.ADMIN, roles.SENATE)
  async updateSession(@Args('input') input: UpdateSessionInput) {
    return this.sessionService.updateSession(input);
  }

  @Mutation(() => AcademicSession, { name: 'activateSession' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(roles.ADMIN, roles.SENATE)
  async activateSession(
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Args('semester', { type: () => Semester }) semester: Semester,
  ) {
    return this.sessionService.activateSession(sessionId, semester);
  }
}
