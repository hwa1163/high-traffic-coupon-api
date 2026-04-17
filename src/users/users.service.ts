import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * 사용자 서비스
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 회원 생성
   */
  async createUser(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        nickname: dto.nickname,
      },
    });

    return {
      ...user,
      id: user.id.toString(), // BigInt → string 변환
    };
  }

  /**
   * 전체 회원 조회
   */
  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      ...user,
      id: user.id.toString(), // BigInt → string 변환
    }));
  }
}