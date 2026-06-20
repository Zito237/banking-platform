import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()

  const port = process.env.PORT || 9003
  await app.listen(port)

  console.log(`[AUDIT] Service HTTP demarre sur le port ${port}`)
  console.log(`[AUDIT] Health : http://localhost:${port}/health`)
  console.log(`[AUDIT] Logs   : http://localhost:${port}/audit`)
}

bootstrap()
