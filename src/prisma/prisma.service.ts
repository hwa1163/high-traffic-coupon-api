import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 서비스
 * - Nest의 DI로 주입해서 DB 접근에 사용
 * - 앱 시작 시 DB 연결
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  /**
   * 모듈 초기화 시 DB 연결
   */
  async onModuleInit() {
    await this.$connect();
  }
}