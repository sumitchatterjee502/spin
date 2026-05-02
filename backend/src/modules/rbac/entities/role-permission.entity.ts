import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Table({ tableName: 'role_permissions', underscored: true, timestamps: false })
export class RolePermission extends Model {
  @PrimaryKey
  @ForeignKey(() => Role)
  @Column(DataType.INTEGER.UNSIGNED)
  declare roleId: number;

  @PrimaryKey
  @ForeignKey(() => Permission)
  @Column(DataType.INTEGER.UNSIGNED)
  declare permissionId: number;
}
