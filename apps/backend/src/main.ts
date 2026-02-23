import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { auth } from 'lib/auth';
import fastifyMultipart from '@fastify/multipart';

interface AuthAdapter {
  handler: (request: Request) => Promise<Response>;
  api: {
    generateOpenAPISchema: () => Promise<unknown>;
  };
}

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('CRITICAL: Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  // Give some time for logging to complete before exiting
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    timestamp: new Date().toISOString(),
  });
  // Give some time for logging to complete before exiting
  setTimeout(() => process.exit(1), 1000);
});

async function bootstrap() {
  console.log('--- STARTING BOOTSTRAP ---');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Node Version:', process.version);
  console.log('CWD:', process.cwd());
  console.log('Memory Usage:', process.memoryUsage());
  console.log('Environment Variables Check:', {
    DATABASE_URL: !!process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_BASE_URL: process.env.BETTER_AUTH_BASE_URL,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
  });

  try {
    const typedAuth = auth as AuthAdapter;

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
    );

    const fastify = app.getHttpAdapter().getInstance();

    // Register raw body plugin to securely verify webhooks
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await fastify.register(require('fastify-raw-body'), {
      field: 'rawBody',
      global: false,
      encoding: 'utf8',
      runFirst: true,
      routes: ['/webhooks/paystack'],
    });

    // Register multipart plugin (required for request.parts())
    await fastify.register(fastifyMultipart, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    });

    // Hook to handle GraphQL multipart uploads
    interface MultipartFile {
      filename: string;
      mimetype: string;
      encoding: string;
      data: Buffer;
    }

    fastify.addHook('preHandler', async (request) => {
      // Only process GraphQL multipart requests
      if (request.url === '/graphql' && request.isMultipart?.()) {
        try {
          const parts = request.parts();
          const fields: Record<string, unknown> = {};
          const files: Record<string, MultipartFile> = {};

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

          // Parse operations
          const operationsProp = fields.operations;
          const operations = (
            typeof operationsProp === 'string'
              ? JSON.parse(operationsProp)
              : operationsProp
          ) as Record<string, any>;

          // Parse map
          const mapProp = fields.map;
          const map: Record<string, string[]> = (
            mapProp
              ? typeof mapProp === 'string'
                ? JSON.parse(mapProp)
                : mapProp
              : {}
          ) as Record<string, string[]>;

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
                const parts = path.split('.');
                let current = operations;

                for (let i = 0; i < parts.length - 1; i++) {
                  if (!current[parts[i]]) current[parts[i]] = {};
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  current = current[parts[i]];
                }

                current[parts[parts.length - 1]] = uploadFile;
                console.log(`Mapped file to: ${path}`);
              }
            }
          }

          // Set parsed body for Apollo
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

    fastify.route({
      method: ['GET', 'POST'],
      url: '/api/auth/*',
      async handler(request, reply) {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const headers = new Headers();
        Object.entries(request.headers).forEach(([key, value]) => {
          if (value) headers.append(key, value.toString());
        });

        let body: BodyInit | undefined;

        if (request.method !== 'GET' && request.method !== 'HEAD') {
          const incomingBody = request.body;

          if (typeof incomingBody === 'string') {
            body = incomingBody;
          } else if (incomingBody instanceof Uint8Array) {
            body = new Uint8Array(incomingBody).buffer;
          } else if (incomingBody !== undefined && incomingBody !== null) {
            body = JSON.stringify(incomingBody);
          }
        }

        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          body,
        });

        const response = await typedAuth.handler(req);
        reply.status(response.status);
        response.headers.forEach((value, key) => {
          reply.header(key, value);
        });
        reply.send(response.body ? await response.text() : null);
      },
    });

    app.enableCors({
      origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        'http://localhost:3002',
        'https://sumas-admin.vercel.app',
        'https://sumas-staffs.vercel.app',
        'https://sumas-students.vercel.app',
        'https://sumas-2z59.onrender.com',
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    await typedAuth.api.generateOpenAPISchema();
    const port = process.env.PORT ?? 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log(`Listening on host: 0.0.0.0`);
    console.log('--- BOOTSTRAP COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('--- BOOTSTRAP FAILED ---');
    console.error('Error Object:', error);
    if (error instanceof Error) {
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
    }
    // Exit with status 1 to ensure Render knows it failed
    process.exit(1);
  }
}

void bootstrap();
