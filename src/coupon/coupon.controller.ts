import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { IssueCouponDto } from './dto/issue-coupon.dto';

/**
 * 쿠폰 관련 API 컨트롤러
 */
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * 쿠폰 생성
   */
  @Post()
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponService.createCoupon(dto);
  }

  /**
   * 쿠폰 발급
   */
  @Post(':couponId/issue')
  async issueCoupon(
    @Param('couponId', ParseIntPipe) couponId: number,
    @Body() dto: IssueCouponDto,
  ) {
    return this.couponService.issueCoupon(couponId, dto.userId);
  }
}