import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { User } from '../users/entities/user.entity';

export type PublicUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async register(dto: CreateUserDto): Promise<PublicUser> {
    const user = await this.usersService.create(dto);
    return this.toPublicUser(user);
  }

  async login(dto: LoginDto): Promise<PublicUser> {
    const user = await this.usersService.findByEmail(dto.email);
    // Mismo mensaje para correo inexistente y password incorrecto, para no revelar cual fallo.
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new BadRequestException('Correo o contrasena incorrectos');
    }
    return this.toPublicUser(user);
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isNotificationEnabled: user.isNotificationEnabled,
    };
  }
}
