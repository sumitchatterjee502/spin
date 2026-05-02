import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { User } from '../../rbac/entities/user.entity';
import { Lead } from './lead.model';

@Table({ tableName: 'receipts', underscored: true, updatedAt: false })
export class Receipt extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @ForeignKey(() => Lead)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  declare leadId: number | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  declare userId: number | null;

  @Column({
    type: DataType.STRING(2048),
    allowNull: false,
    field: 'file_url',
  })
  declare imageUrl: string;

  @Column({ type: DataType.STRING(128), allowNull: false, unique: true })
  declare receiptNumber: string;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare fileType: string;

  @Column({ type: DataType.STRING(64), allowNull: false, unique: true })
  declare hash: string;

  @Column({ type: DataType.STRING(64), allowNull: true })
  declare pHash: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isUsed: boolean;

  @BelongsTo(() => Lead)
  declare lead?: Lead;

  @BelongsTo(() => User)
  declare user?: User;

  @CreatedAt
  declare createdAt: Date;
}
