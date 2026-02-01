import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';
import { UploadResolver } from './upload.resolver';

@Module({
  imports: [CloudinaryModule],
  providers: [UploadResolver],
})
export class UploadModule {}
