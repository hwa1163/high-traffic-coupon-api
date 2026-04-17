import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * 이벤트 목록 조회 쿼리 DTO
 * - page: 페이지 번호 (1부터 시작)
 * - size: 페이지 크기
 * - sort: 정렬 기준
 */
export class GetEventsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page는 정수여야 합니다.' })
  @Min(1, { message: 'page는 1 이상이어야 합니다.' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'size는 정수여야 합니다.' })
  @Min(1, { message: 'size는 1 이상이어야 합니다.' })
  @Max(100, { message: 'size는 100 이하여야 합니다.' })
  size: number = 10;

  @IsOptional()
  @Transform(({ value }) => value ?? 'latest')
  @IsIn(['latest', 'oldest', 'remainingDesc', 'remainingAsc', 'startAtAsc'], {
    message: 'sort는 latest, oldest, remainingDesc, remainingAsc, startAtAsc 중 하나여야 합니다.',
  })
  sort: string = 'latest';
}