import {
  AutoIncrement,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';

@Table({ tableName: 'permissions', underscored: true })
export class Permission extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @Column({
    type: DataType.STRING(128),
    unique: true,
    allowNull: false,
    field: 'permission_key',
  })
  declare permissionKey: string;

  @Column({ type: DataType.STRING(512), allowNull: true })
  declare description: string | null;

  @BelongsToMany(() => Role, () => RolePermission)
  declare roles?: Role[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
