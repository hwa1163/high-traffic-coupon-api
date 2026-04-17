import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * 쿠폰 생성 요청 DTO
 */
export class CreateCouponDto {
  @IsInt()
  @Min(1)
  eventId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsInt()
  @Min(1)
  totalQuantity: number;

  @IsOptional()
  @IsDateString()
  issuedStartAt?: string;

  @IsOptional()
  @IsDateString()
  issuedEndAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}