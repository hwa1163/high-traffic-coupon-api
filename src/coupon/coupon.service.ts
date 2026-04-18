import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { serializeBigInt } from '../common/utils/bigint.util';

/**
 * 쿠폰 서비스
 * - 쿠폰 생성
 * - 쿠폰 발급
 * - 동시성 제어
 */
@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 쿠폰 생성
   */
  async createCoupon(dto: CreateCouponDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(dto.eventId) },
    });

    if (!event) {
      throw new NotFoundException('존재하지 않는 이벤트입니다.');
    }

    if (dto.issuedStartAt && dto.issuedEndAt) {
      const start = new Date(dto.issuedStartAt);
      const end = new Date(dto.issuedEndAt);

      if (start >= end) {
        throw new BadRequestException('발급 시작일은 종료일보다 빨라야 합니다.');
      }
    }

    try {
      const coupon = await this.prisma.coupon.create({
        data: {
          eventId: BigInt(dto.eventId),
          name: dto.name,
          code: dto.code,
          totalQuantity: dto.totalQuantity,
          issuedStartAt: dto.issuedStartAt ? new Date(dto.issuedStartAt) : null,
          issuedEndAt: dto.issuedEndAt ? new Date(dto.issuedEndAt) : null,
          isActive: dto.isActive ?? true,
        },
      });

      return serializeBigInt(coupon);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('이미 사용 중인 쿠폰 코드입니다.');
      }

      throw error;
    }
  }

  /**
   * 쿠폰 발급
   *
   * 핵심 목표:
   * 1. 같은 유저의 중복 발급 방지
   * 2. 총 수량 초과 발급 방지
   * 3. 동시 요청에서도 안전한 처리
   * 4. 데드락/일시적 충돌 발생 시 제한적으로 재시도
   */
  async issueCoupon(couponId: number, userId: number) {
    const now = new Date();

    const coupon = await this.prisma.coupon.findUnique({
      where: { id: BigInt(couponId) },
    });

    if (!coupon) {
      throw new NotFoundException('존재하지 않는 쿠폰입니다.');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('비활성화된 쿠폰입니다.');
    }

    if (coupon.issuedStartAt && now < coupon.issuedStartAt) {
      throw new BadRequestException('아직 발급 시작 전인 쿠폰입니다.');
    }

    if (coupon.issuedEndAt && now > coupon.issuedEndAt) {
      throw new BadRequestException('발급 기간이 종료된 쿠폰입니다.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    // 재시도 횟수
    const maxRetryCount = 3;

    for (let attempt = 1; attempt <= maxRetryCount; attempt++) {
      try {
        await this.issueCouponTransaction(couponId, userId);

        return {
          message: '쿠폰 발급이 완료되었습니다.',
          couponId,
          userId,
        };
      } catch (error) {
        console.error(`쿠폰 발급 중 예외 발생 (attempt=${attempt}):`, error);

        // 중복 발급
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new BadRequestException('이미 발급받은 쿠폰입니다.');
        }

        // 데드락 / Raw query 실패(P2010 + 1213) 인 경우에만 재시도
        if (this.isRetryableDeadlockError(error)) {
          // 마지막 시도까지 실패하면 사용자에게 안내
          if (attempt === maxRetryCount) {
            throw new BadRequestException(
              '동시 요청 충돌이 발생했습니다. 다시 시도해주세요.',
            );
          }

          // 아주 짧게 대기 후 재시도
          await this.sleep(50 * attempt);
          continue;
        }

        // 품절/발급불가 등 비즈니스 예외는 그대로 던짐
        throw error;
      }
    }
  }

  /**
   * 실제 쿠폰 발급 트랜잭션
   * - 먼저 쿠폰 수량을 조건부 증가시켜 자리 선점
   * - 이후 발급 이력을 생성
   */
  private async issueCouponTransaction(couponId: number, userId: number) {
    await this.prisma.$transaction(async (tx) => {
      const updatedRowCount = await tx.$executeRaw`
        UPDATE coupons
        SET issuedCount = issuedCount + 1,
            updatedAt = NOW()
        WHERE id = ${BigInt(couponId)}
          AND isActive = true
          AND (issuedStartAt IS NULL OR issuedStartAt <= NOW())
          AND (issuedEndAt IS NULL OR issuedEndAt >= NOW())
          AND issuedCount < totalQuantity
      `;

      if (updatedRowCount === 0) {
        throw new BadRequestException(
          '쿠폰이 모두 소진되었거나 발급 가능한 상태가 아닙니다.',
        );
      }

      try {
        await tx.couponIssue.create({
          data: {
            couponId: BigInt(couponId),
            userId: BigInt(userId),
          },
        });
      } catch (error) {
        // 동일 유저 중복 발급이면 수량 원복
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          await tx.$executeRaw`
            UPDATE coupons
            SET issuedCount = issuedCount - 1,
                updatedAt = NOW()
            WHERE id = ${BigInt(couponId)}
              AND issuedCount > 0
          `;

          throw error;
        }

        throw error;
      }
    });
  }

  /**
   * 재시도 가능한 데드락 예외인지 판단
   * - Prisma P2010 + DB code 1213
   */
  private isRetryableDeadlockError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2010' &&
      (error.meta as { code?: string } | undefined)?.code === '1213'
    );
  }

  /**
   * 재시도 전 잠깐 대기
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}