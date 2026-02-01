import { Args, Mutation, Resolver, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthGuard } from '../../common/auth/auth.guard';
import { User } from '../../common/entities/user.entity';

@Resolver(() => User)
@UseGuards(AuthGuard)
export class UserResolver {
  constructor(private prisma: PrismaService) {}

  @Mutation(() => User)
  async updateProfileImage(
    @Context() context: any,
    @Args('image') image: string,
  ): Promise<User> {
    const userId = context.req?.user?.id || context.request?.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { image },
    });

    return {
      ...updatedUser,
      image: updatedUser.image ?? undefined,
      gender: updatedUser.gender ?? undefined,
    };
  }
}
