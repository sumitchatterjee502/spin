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
  UpdatedAt,
} from 'sequelize-typescript';
import { Campaign } from '../../campaign/campaign.model';

@Table({ tableName: 'qr_mappings', underscored: true })
export class QrMapping extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @Column({ type: DataType.STRING(64), allowNull: false, unique: true })
  declare code: string;

  @ForeignKey(() => Campaign)
  @Column(DataType.INTEGER.UNSIGNED)
  declare campaignId: number;

  @Column({ type: DataType.STRING(2048), allowNull: false })
  declare redirectUrl: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare expiresAt: Date | null;

  @BelongsTo(() => Campaign)
  declare campaign?: Campaign;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
