import {
  AutoIncrement,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  IsEmail,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Role } from './role.entity';
import { UserRole } from './user-role.entity';

@Table({ tableName: 'users', underscored: true })
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @IsEmail
  @Column({ type: DataType.STRING(255), unique: true, allowNull: false })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    field: 'password_hash',
    allowNull: false,
  })
  declare passwordHash: string;

  @Column({ type: DataType.STRING(100), field: 'first_name', allowNull: true })
  declare firstName: string | null;

  @Column({ type: DataType.STRING(100), field: 'last_name', allowNull: true })
  declare lastName: string | null;

  @BelongsToMany(() => Role, () => UserRole)
  declare roles?: Role[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
