import { IsEmail, IsNotEmpty, Length } from 'class-validator';

/**
 * 회원 생성 요청 DTO
 */
export class CreateUserDto {
  @IsEmail({}, { message: '올바른 이메일 형식이어야 합니다.' })
  email: string;

  @IsNotEmpty({ message: '닉네임은 필수입니다.' })
  @Length(2, 50, { message: '닉네임은 2~50자 사이여야 합니다.' })
  nickname: string;
}