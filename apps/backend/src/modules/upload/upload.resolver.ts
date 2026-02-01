import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphQLUpload } from 'graphql-upload-ts';
import type { FileUpload } from 'graphql-upload-ts';
import { Readable } from 'stream';
import { UploadApiResponse } from 'cloudinary';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { UploadResponse } from '../../common/cloudinary/dto/upload-response.dto';
import { AuthGuard } from '../../common/auth/auth.guard';
import { Roles } from '../../common/auth/roles.decorator';

@Resolver()
@UseGuards(AuthGuard)
export class UploadResolver {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Mutation(() => UploadResponse)
  @Roles('admin', 'staff', 'student')
  async uploadImage(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: FileUpload,
  ): Promise<UploadResponse> {
    const { filename, mimetype } = file;

    // Validate file type
    if (!mimetype.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Convert stream to buffer
    const buffer = await this.streamToBuffer(file.createReadStream());

    const multerFile: Express.Multer.File = {
      buffer,
      originalname: filename,
      mimetype,
      fieldname: 'file',
      encoding: '7bit',
      size: buffer.length,
      stream: Readable.from(buffer),
      destination: '',
      filename: '',
      path: '',
    };

    const result = (await this.cloudinaryService.uploadImage(
      multerFile,
      'images',
    )) as UploadApiResponse;

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resourceType: result.resource_type,
    };
  }

  @Mutation(() => [UploadResponse])
  @Roles('admin', 'staff')
  async uploadMultipleImages(
    @Args({ name: 'files', type: () => [GraphQLUpload] })
    files: FileUpload[],
  ): Promise<UploadResponse[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }

  @Mutation(() => UploadResponse)
  @Roles('admin', 'staff', 'student')
  async uploadFile(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: FileUpload,
    @Args({ name: 'folder', type: () => String, nullable: true })
    folder?: string,
  ): Promise<UploadResponse> {
    const { filename, mimetype } = file;

    const buffer = await this.streamToBuffer(file.createReadStream());

    const multerFile: Express.Multer.File = {
      buffer,
      originalname: filename,
      mimetype,
      fieldname: 'file',
      encoding: '7bit',
      size: buffer.length,
      stream: Readable.from(buffer),
      destination: '',
      filename: '',
      path: '',
    };

    const result = (await this.cloudinaryService.uploadFile(
      multerFile,
      folder || 'documents',
      'auto',
    )) as UploadApiResponse;

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resourceType: result.resource_type,
    };
  }

  @Mutation(() => Boolean)
  @Roles('admin', 'staff', 'student')
  async deleteUpload(
    @Args('publicId') publicId: string,
    @Args({ name: 'resourceType', nullable: true, defaultValue: 'image' })
    resourceType?: 'image' | 'video' | 'raw',
  ): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result: any = await this.cloudinaryService.deleteFile(
      publicId,
      resourceType,
    );
    return (result as { result: string }).result === 'ok';
  }

  /**
   * Helper to convert stream to buffer
   */
  private streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk as Buffer));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
