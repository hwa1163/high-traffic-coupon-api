import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

/**
 * 사용자 컨트롤러
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 회원 생성
   */
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    const user = await this.usersService.createUser(dto);

    return {
      success: true,
      data: user,
    };
  }

  /**
   * 회원 목록 조회
   */
  @Get()
  async getUsers() {
    const users = await this.usersService.getUsers();

    return {
      success: true,
      data: users,
    };
  }
}