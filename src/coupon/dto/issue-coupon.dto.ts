import { IsInt, Min } from 'class-validator';

/**
 * 쿠폰 발급 요청 DTO
 */
export class IssueCouponDto {
  @IsInt()
  @Min(1)
  userId: number;
}