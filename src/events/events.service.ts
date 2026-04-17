import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { GetEventsQueryDto } from './dto/get-events-query.dto';

/**
 * 이벤트 서비스
 * - 이벤트 생성
 * - 이벤트 목록 조회
 */
@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 이벤트 생성
   */
  async createEvent(dto: CreateEventDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (startAt >= endAt) {
      throw new BadRequestException('종료일시는 시작일시보다 뒤여야 합니다.');
    }

    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        totalQuantity: dto.totalQuantity,
        remainingQuantity: dto.totalQuantity,
        startAt,
        endAt,
      },
    });

    return this.serializeEvent(event);
  }

  /**
   * 이벤트 목록 조회
   * - page, size 기반 offset pagination
   * - sort 값에 따라 정렬 기준 변경
   */
  async getEvents(query: GetEventsQueryDto) {
    const page = query.page ?? 1;
    const size = query.size ?? 10;
    const skip = (page - 1) * size;
    const take = size;

    const orderBy = this.getOrderBy(query.sort);

    const [events, totalCount] = await Promise.all([
      this.prisma.event.findMany({
        skip,
        take,
        orderBy,
      }),
      this.prisma.event.count(),
    ]);

    return {
      page,
      size,
      totalCount,
      totalPages: Math.ceil(totalCount / size),
      items: events.map((event) => this.serializeEvent(event)),
    };
  }

  /**
   * 정렬 조건 변환
   */
  private getOrderBy(sort?: string) {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' as const };
      case 'remainingDesc':
        return { remainingQuantity: 'desc' as const };
      case 'remainingAsc':
        return { remainingQuantity: 'asc' as const };
      case 'startAtAsc':
        return { startAt: 'asc' as const };
      case 'latest':
      default:
        return { createdAt: 'desc' as const };
    }
  }

  /**
   * BigInt 직렬화 처리
   */
  private serializeEvent(event: {
    id: bigint;
    title: string;
    totalQuantity: number;
    remainingQuantity: number;
    startAt: Date;
    endAt: Date;
    createdAt: Date;
  }) {
    return {
      ...event,
      id: event.id.toString(),
    };
  }
}