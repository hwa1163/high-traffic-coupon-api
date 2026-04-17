import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * 애플리케이션 시작점
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * 전역 유효성 검증 파이프 적용
   * - DTO에 없는 값 제거
   * - 잘못된 요청값은 400 에러 반환
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
  console.log('🚀 server running: http://localhost:3000');
}
bootstrap();