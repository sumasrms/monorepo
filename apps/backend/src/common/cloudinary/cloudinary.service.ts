import { Injectable } from '@nestjs/common';
import {
  ConfigAndUrlOptions,
  TransformationOptions,
  UploadApiErrorResponse,
  UploadApiResponse,
  v2,
} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  /**
   * Upload an image to Cloudinary
   * @param file - Multer file object
   * @param folder - Optional folder path in Cloudinary
   * @returns Upload response with URL and metadata
   */
  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        {
          folder: folder || 'uploads',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(new Error(error.message || 'Upload failed'));
          if (!result)
            return reject(new Error('Upload failed: No result returned'));
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }

  /**
   * Upload any file type to Cloudinary
   * @param file - Multer file object
   * @param folder - Optional folder path
   * @param resourceType - auto, image, video, or raw
   * @returns Upload response
   */
  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
    resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        {
          folder: folder || 'uploads',
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) return reject(new Error(error.message || 'Upload failed'));
          if (!result)
            return reject(new Error('Upload failed: No result returned'));
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - The public ID of the file
   * @param resourceType - Type of resource (image, video, raw)
   * @returns Deletion result
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<any> {
    return v2.uploader.destroy(publicId, { resource_type: resourceType });
  }

  /**
   * Generate a signed URL for secure access
   * @param publicId - The public ID of the file
   * @param options - Optional transformation options
   * @returns Signed URL
   */
  getSignedUrl(
    publicId: string,
    options?: TransformationOptions | ConfigAndUrlOptions,
  ): string {
    return v2.url(publicId, {
      sign_url: true,
      ...(options || {}),
    });
  }

  /**
   * Get optimized image URL with transformations
   * @param publicId - The public ID
   * @param width - Desired width
   * @param height - Desired height
   * @param crop - Crop mode
   * @returns Transformed URL
   */
  getOptimizedImageUrl(
    publicId: string,
    width?: number,
    height?: number,
    crop: string = 'fill',
  ): string {
    return v2.url(publicId, {
      width,
      height,
      crop,
      quality: 'auto',
      fetch_format: 'auto',
    });
  }
}
