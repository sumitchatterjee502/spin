import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Role } from './role.entity';
import { User } from './user.entity';

@Table({ tableName: 'user_roles', underscored: true, timestamps: false })
export class UserRole extends Model {
  @PrimaryKey
  @ForeignKey(() => User)
  @Column(DataType.INTEGER.UNSIGNED)
  declare userId: number;

  @PrimaryKey
  @ForeignKey(() => Role)
  @Column(DataType.INTEGER.UNSIGNED)
  declare roleId: number;
}
