import { Client } from 'minio'
import { randomUUID } from 'node:crypto'

// MinIO (S3-compatible) self-hosted. Config vía .env.
// MINIO_ENDPOINT=http://localhost:9000  MINIO_ACCESS_KEY  MINIO_SECRET_KEY  MINIO_BUCKET
const endpoint = new URL(process.env.MINIO_ENDPOINT ?? 'http://localhost:9000')
const BUCKET = process.env.MINIO_BUCKET ?? 'neurax-media'

export const minioClient = new Client({
  endPoint: endpoint.hostname,
  port: Number(endpoint.port) || (endpoint.protocol === 'https:' ? 443 : 9000),
  useSSL: endpoint.protocol === 'https:',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
})

let bucketReady = false

/** Garantiza que el bucket exista y sea de lectura pública (para servir avatares). */
async function ensureBucket(): Promise<void> {
  if (bucketReady) return
  const exists = await minioClient.bucketExists(BUCKET).catch(() => false)
  if (!exists) {
    await minioClient.makeBucket(BUCKET)
    // Política de lectura pública solo para el bucket de media
    await minioClient.setBucketPolicy(
      BUCKET,
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET}/*`],
          },
        ],
      }),
    )
  }
  bucketReady = true
}

/**
 * Sube un buffer y devuelve la URL pública.
 * @param prefix carpeta lógica dentro del bucket (ej. 'avatars')
 */
export async function uploadObject(
  buffer: Buffer,
  prefix: string,
  contentType: string,
): Promise<string> {
  await ensureBucket()
  const ext = contentType.split('/')[1]?.split('+')[0] ?? 'bin'
  const objectName = `${prefix}/${randomUUID()}.${ext}`
  await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': contentType,
  })
  // URL pública directa al objeto
  return `${process.env.MINIO_ENDPOINT ?? 'http://localhost:9000'}/${BUCKET}/${objectName}`
}
