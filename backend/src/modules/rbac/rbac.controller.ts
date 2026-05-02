import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionKey } from './constants/permission-keys';
import { Permissions } from './decorators/permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { RbacService } from './rbac.service';

@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('me')
  async me(@Req() req: Request) {
    const userId = req.user!.id;
    const permissions = await this.rbacService.getPermissionKeysForUser(userId);
    return {
      user: { id: userId, email: req.user!.email },
      permissions,
    };
  }

  @Get('permissions')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.RbacManage)
  async listPermissions() {
    const rows = await this.rbacService.listPermissions();
    return rows.map((p) => ({
      id: p.id,
      key: p.permissionKey,
      description: p.description,
    }));
  }

  @Post('permissions')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.RbacManage)
  async createPermission(@Body() dto: CreatePermissionDto) {
    const p = await this.rbacService.createPermission(
      dto.permissionKey,
      dto.description,
    );
    return {
      id: p.id,
      key: p.permissionKey,
      description: p.description,
    };
  }

  @Delete('permissions/:permissionId')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.RbacManage)
  async deletePermission(
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    await this.rbacService.deletePermission(permissionId);
    return { ok: true };
  }

  @Get('roles')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.RbacManage)
  async listRoles() {
    const roles = await this.rbacService.listRoles();
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: (r.permissions ?? []).map((p) => p.permissionKey),
    }));
  }

  @Post('roles')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.RbacManage)
  async createRole(@Body() dto: CreateRoleDto) {
    const role = await this.rbacService.createRole(dto.name, dto.description);
    return { id: role.id, name: role.name, description: role.description };
  }

  @Patch('roles/:roleId')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.RbacManage)
  async updateRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: UpdateRoleDto,
  ) {
    const role = await this.rbacService.updateRole(roleId, {
      name: dto.name,
      description: dto.description,
    });
    return { id: role.id, name: role.name, description: role.description };
  }

  @Post('roles/:roleId/permissions')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.RbacManage)
  async setRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: SetRolePermissionsDto,
  ) {
    await this.rbacService.setRolePermissionsByKeys(roleId, dto.permissionKeys);
    return { ok: true };
  }

  @Post('users/:userId/roles')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.RbacManage)
  async assignUserRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AssignUserRoleDto,
  ) {
    await this.rbacService.assignRoleToUser(userId, dto.roleId);
    return { ok: true };
  }

  @Delete('users/:userId/roles/:roleId')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.RbacManage)
  async revokeUserRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    await this.rbacService.revokeRoleFromUser(userId, roleId);
    return { ok: true };
  }
}
