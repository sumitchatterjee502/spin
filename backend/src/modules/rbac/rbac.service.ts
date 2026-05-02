import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Permission)
    private readonly permissionModel: typeof Permission,
    @InjectModel(UserRole) private readonly userRoleModel: typeof UserRole,
    @InjectModel(RolePermission)
    private readonly rolePermissionModel: typeof RolePermission,
  ) {}

  async getUserRoleSummaries(
    userId: number,
  ): Promise<{ id: number; name: string }[]> {
    const user = await this.userModel.findByPk(userId, {
      include: [
        {
          model: this.roleModel,
          through: { attributes: [] },
          attributes: ['id', 'name'],
        },
      ],
    });
    if (!user?.roles?.length) {
      return [];
    }
    return user.roles.map((r) => ({ id: r.id, name: r.name }));
  }

  /** Distinct permission rows for the user (via roles). */
  async getUserPermissionsForLogin(userId: number): Promise<Permission[]> {
    const rows = await this.permissionModel.findAll({
      attributes: ['id', 'permissionKey'],
      include: [
        {
          model: this.roleModel,
          required: true,
          attributes: [],
          through: { attributes: [] },
          include: [
            {
              model: this.userModel,
              required: true,
              attributes: [],
              where: { id: userId },
              through: { attributes: [] },
            },
          ],
        },
      ],
      order: [['permissionKey', 'ASC']],
    });
    const byId = new Map<number, Permission>();
    for (const p of rows) {
      byId.set(p.id, p);
    }
    return [...byId.values()];
  }

  async getPermissionKeysForUser(userId: number): Promise<string[]> {
    const rows = await this.permissionModel.findAll({
      attributes: ['permissionKey'],
      include: [
        {
          model: this.roleModel,
          required: true,
          attributes: [],
          through: { attributes: [] },
          include: [
            {
              model: this.userModel,
              required: true,
              attributes: [],
              where: { id: userId },
              through: { attributes: [] },
            },
          ],
        },
      ],
    });
    return [...new Set(rows.map((p) => p.permissionKey))];
  }

  async userHasAllPermissions(
    userId: number,
    keys: string[],
  ): Promise<boolean> {
    if (keys.length === 0) {
      return true;
    }
    const owned = new Set(await this.getPermissionKeysForUser(userId));
    return keys.every((k) => owned.has(k));
  }

  async userHasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
    const count = await this.roleModel.count({
      where: { name: { [Op.in]: roleNames } },
      include: [
        {
          model: this.userModel,
          required: true,
          attributes: [],
          where: { id: userId },
          through: { attributes: [] },
        },
      ],
    });
    return count > 0;
  }

  async listPermissions(): Promise<Permission[]> {
    return this.permissionModel.findAll({ order: [['permissionKey', 'ASC']] });
  }

  async createPermission(
    permissionKey: string,
    description?: string,
  ): Promise<Permission> {
    const key = permissionKey.trim().toLowerCase();
    const existing = await this.permissionModel.findOne({
      where: { permissionKey: key },
    });
    if (existing) {
      throw new BadRequestException('Permission key already exists');
    }
    return this.permissionModel.create({
      permissionKey: key,
      description: description?.trim() ? description.trim() : null,
    });
  }

  async deletePermission(permissionId: number): Promise<void> {
    const permission = await this.permissionModel.findByPk(permissionId);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    await permission.destroy();
  }

  async listRoles(): Promise<Role[]> {
    return this.roleModel.findAll({
      include: [
        {
          model: this.permissionModel,
          through: { attributes: [] },
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async createRole(name: string, description?: string): Promise<Role> {
    const existing = await this.roleModel.findOne({ where: { name } });
    if (existing) {
      throw new BadRequestException('Role name already exists');
    }
    return this.roleModel.create({ name, description: description ?? null });
  }

  async updateRole(
    roleId: number,
    patch: { name?: string; description?: string | null },
  ): Promise<Role> {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (patch.name !== undefined && patch.name !== role.name) {
      const clash = await this.roleModel.findOne({
        where: { name: patch.name },
      });
      if (clash) {
        throw new BadRequestException('Role name already exists');
      }
      role.name = patch.name;
    }
    if (patch.description !== undefined) {
      role.description = patch.description;
    }
    await role.save();
    return role;
  }

  async setRolePermissionsByKeys(
    roleId: number,
    permissionKeys: string[],
    transaction?: Transaction,
  ): Promise<void> {
    const role = await this.roleModel.findByPk(roleId, { transaction });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const permissions = await this.permissionModel.findAll({
      where: { permissionKey: { [Op.in]: permissionKeys } },
      transaction,
    });
    if (permissions.length !== permissionKeys.length) {
      throw new BadRequestException('One or more permission keys are invalid');
    }
    await this.rolePermissionModel.destroy({
      where: { roleId },
      transaction,
    });
    await this.rolePermissionModel.bulkCreate(
      permissions.map((p) => ({ roleId, permissionId: p.id })),
      { transaction },
    );
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const role = await this.roleModel.findByPk(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    await this.userRoleModel.findOrCreate({
      where: { userId, roleId },
      defaults: { userId, roleId },
    });
  }

  async revokeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await this.userRoleModel.destroy({ where: { userId, roleId } });
  }

  async ensureDefaultRoleForUser(
    userId: number,
    roleName: string,
  ): Promise<void> {
    const role = await this.roleModel.findOne({ where: { name: roleName } });
    if (!role) {
      return;
    }
    await this.assignRoleToUser(userId, role.id);
  }
}
