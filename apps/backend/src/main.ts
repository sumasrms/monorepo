import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { auth } from 'lib/auth';
import { toNodeHandler } from 'better-auth/node';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // app.setGlobalPrefix('api');

  const fastify = app.getHttpAdapter().getInstance();

  // Register multipart plugin (required for request.parts())
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // Hook to handle GraphQL multipart uploads
  fastify.addHook('preHandler', async (request, reply) => {
    // Only process GraphQL multipart requests
    if (request.url === '/graphql' && request.isMultipart?.()) {
      try {
        const parts = request.parts();
        const fields: Record<string, any> = {};
        const files: Record<string, any> = {};

        // Iterate through all multipart parts
        for await (const part of parts) {
          if (part.type === 'file') {
            // Store file with metadata
            files[part.fieldname] = {
              filename: part.filename,
              mimetype: part.mimetype,
              encoding: part.encoding,
              data: await part.toBuffer(),
            };
          } else {
            // Store field value
            fields[part.fieldname] = part.value;
          }
        }

        console.log('=== Multipart GraphQL Request ===');
        console.log('Fields:', Object.keys(fields));
        console.log('Files:', Object.keys(files));

        // Parse operations
        const operations =
          typeof fields.operations === 'string'
            ? JSON.parse(fields.operations)
            : fields.operations;

        // Parse map
        const map = fields.map
          ? typeof fields.map === 'string'
            ? JSON.parse(fields.map)
            : fields.map
          : {};

        console.log('Parsed operations:', operations);
        console.log('Parsed map:', map);

        // Map files to operations
        if (Object.keys(map).length > 0) {
          const { Readable } = await import('stream');

          for (const [fileKey, paths] of Object.entries(map)) {
            const file = files[fileKey];

            if (!file) {
              console.error(`File not found for key: ${fileKey}`);
              continue;
            }

            console.log(`Processing file ${fileKey}:`, {
              filename: file.filename,
              mimetype: file.mimetype,
              size: file.data.length,
            });

            // Create Upload-compatible Promise (graphql-upload-ts expects a Promise)
            const uploadFile = Promise.resolve({
              filename: file.filename,
              mimetype: file.mimetype,
              encoding: file.encoding,
              createReadStream: () => {
                const readable = new Readable();
                readable.push(file.data);
                readable.push(null);
                return readable;
              },
            });

            // Map to variable paths
            const pathArray = Array.isArray(paths) ? paths : [paths];
            for (const path of pathArray) {
              const parts = (path as string).split('.');
              let current = operations;

              for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
              }

              current[parts[parts.length - 1]] = uploadFile;
              console.log(`Mapped file to: ${path}`);
            }
          }
        }

        // Set parsed body for Apollo
        (request as any).body = operations;

        console.log('Successfully processed multipart GraphQL request');
      } catch (error) {
        console.error('Error processing multipart:', error);
      }
    }
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  // await fastify.register(fastifyCors, {
  //   origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  //   credentials: true,
  //   maxAge: 86400,
  // });
  fastify.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });

      // Optionally add custom headers here
      // headers.append('x-internal-tenantid', 'your-tenant-id');

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.send(response.body ? await response.text() : null);
    },
  });

  // const corsURLS = ['http://localhost:3000'];

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:3002',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await auth.api.generateOpenAPISchema();
  await app.listen(process.env.PORT ?? 4000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
