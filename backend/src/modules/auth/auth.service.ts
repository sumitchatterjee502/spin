import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { RbacService } from '../rbac/rbac.service';
import { User } from '../rbac/entities/user.entity';
import type {
  LoginApiResponse,
  LoginPermissionDto,
  RegisterApiResponse,
} from './types/login-response.types';
import { JwtPayload } from './strategies/jwt.strategy';
import { splitPermissionKey } from './utils/permission-key.util';

const BCRYPT_ROUNDS = 10;
const DEFAULT_PARTICIPANT_ROLE = 'participant';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly jwtService: JwtService,
    private readonly rbacService: RbacService,
  ) {}

  async register(
    email: string,
    password: string,
  ): Promise<RegisterApiResponse> {
    const existing = await this.userModel.findOne({
      where: { email: email.toLowerCase() },
      attributes: ['id'],
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.userModel.create({
      email: email.toLowerCase(),
      passwordHash,
    });
    await this.rbacService.ensureDefaultRoleForUser(
      user.id,
      DEFAULT_PARTICIPANT_ROLE,
    );
    return {
      error: false,
      message: 'Registration successful',
      statusCode: 201,
      responseData: { id: user.id, email: user.email },
    };
  }

  async login(email: string, password: string): Promise<LoginApiResponse> {
    const user = await this.userModel.findOne({
      where: { email: email.toLowerCase() },
      attributes: ['id', 'email', 'passwordHash'],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { sub: String(user.id), email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    const [roles, permissionRows] = await Promise.all([
      this.rbacService.getUserRoleSummaries(user.id),
      this.rbacService.getUserPermissionsForLogin(user.id),
    ]);

    const permissions: LoginPermissionDto[] = permissionRows.map((p) => {
      const { module, action } = splitPermissionKey(p.permissionKey);
      return {
        id: p.id,
        name: p.permissionKey,
        module,
        action,
      };
    });

    const permissionsGroupedByModule =
      this.buildPermissionsGroupedByModule(permissions);

    return {
      error: false,
      message: 'Login successful',
      statusCode: 200,
      responseData: {
        accessToken,
        admin: {
          id: user.id,
          firstName: null,
          lastName: null,
          email: user.email,
          roles,
          permissions,
          permissionsGroupedByModule,
        },
      },
    };
  }

  private buildPermissionsGroupedByModule(
    permissions: LoginPermissionDto[],
  ): { module: string; permissions: LoginPermissionDto[] }[] {
    const map = new Map<string, LoginPermissionDto[]>();
    for (const p of permissions) {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, perms]) => ({
        module,
        permissions: [...perms].sort((x, y) => x.name.localeCompare(y.name)),
      }));
  }
}
