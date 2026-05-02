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
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { User } from './user.entity';
import { UserRole } from './user-role.entity';

@Table({ tableName: 'roles', underscored: true })
export class Role extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @Column({ type: DataType.STRING(64), unique: true, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(512), allowNull: true })
  declare description: string | null;

  @BelongsToMany(() => User, () => UserRole)
  declare users?: User[];

  @BelongsToMany(() => Permission, () => RolePermission)
  declare permissions?: Permission[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
