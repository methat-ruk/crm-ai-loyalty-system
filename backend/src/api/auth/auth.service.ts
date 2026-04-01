import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email is already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        role: dto.role,
      },
      omit: { password: true },
    });

    const accessToken = this.signToken(user.id, user.email, user.role);
    return { accessToken, user };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Incorrect email or password.');

    // Destructure here — password is used directly in bcrypt.compare below
    const { password, ...safeUser } = user;

    const isValid = await bcrypt.compare(dto.password, password);
    if (!isValid) throw new UnauthorizedException('Incorrect email or password.');

    if (!safeUser.isActive)
      throw new UnauthorizedException('Account is inactive');

    const accessToken = this.signToken(
      safeUser.id,
      safeUser.email,
      safeUser.role,
    );
    return { accessToken, user: safeUser };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private signToken(id: string, email: string, role: string): string {
    const options: jwt.SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN ??
        '7d') as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign({ sub: id, email, role }, process.env.JWT_SECRET!, options);
  }
}
