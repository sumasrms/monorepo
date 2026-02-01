import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { PrismaModule } from './common/prisma/prisma.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { DepartmentModule } from './modules/department/department.module';
import { CourseModule } from './modules/course/course.module';
import { GradeScaleModule } from './modules/grade-scale/grade-scale.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { UploadModule } from './modules/upload/upload.module';
import { UserModule } from './modules/user/user.module';
import { StaffModule } from './modules/staff/staff.module';
import { StudentModule } from './modules/student/student.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { join } from 'path';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      debug: true,
      playground: true,
      sortSchema: true,
      csrfPrevention: false, // Required for file uploads
    }),
    PrismaModule,
    FacultyModule,
    DepartmentModule,
    CourseModule,
    GradeScaleModule,
    SettingsModule,
    CloudinaryModule,
    UploadModule,
    UserModule,
    StaffModule,
    StudentModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
// Force restart
