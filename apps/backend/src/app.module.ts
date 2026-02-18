import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { ResultModule } from './modules/result/result.module';
import { SessionModule } from './modules/session/session.module';
import { SessionInterceptor } from './common/interceptors/session.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { join } from 'path';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { QueueModule } from './queues/queue.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './modules/audit/audit.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    ResultModule,
    SessionModule,
    NotificationsModule,
    QueueModule,
    EmailModule,
    AuditModule,
    PaymentModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    AppResolver,
    {
      provide: APP_INTERCEPTOR,
      useClass: SessionInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}

// Force restart
