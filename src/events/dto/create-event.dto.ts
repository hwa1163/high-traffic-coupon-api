import { IsDateString, IsInt, IsNotEmpty, Min } from 'class-validator';

/**
 * 이벤트 생성 요청 DTO
 */
export class CreateEventDto {
  @IsNotEmpty({ message: '이벤트 제목은 필수입니다.' })
  title: string;

  @IsInt({ message: '총 수량은 정수여야 합니다.' })
  @Min(1, { message: '총 수량은 1 이상이어야 합니다.' })
  totalQuantity: number;

  @IsDateString({}, { message: '시작일시는 ISO 형식이어야 합니다.' })
  startAt: string;

  @IsDateString({}, { message: '종료일시는 ISO 형식이어야 합니다.' })
  endAt: string;
}