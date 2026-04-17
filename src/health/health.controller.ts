import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 서버/DB 상태 확인용 컨트롤러
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 서버와 DB 연결 상태 확인
   */
  @Get()
  async check() {
    await this.prismaService.$queryRaw`SELECT 1`;

    return {
      success: true,
      message: '서버와 DB 연결이 정상입니다.',
      timestamp: new Date().toISOString(),
    };
  }
}