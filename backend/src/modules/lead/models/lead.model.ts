import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Campaign } from '../../campaign/campaign.model';
import { QrMapping } from '../../qr-mapping/models/qr-mapping.model';
import { Receipt } from './receipt.model';

@Table({ tableName: 'leads', underscored: true })
export class Lead extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(32), allowNull: false })
  declare phone: string;

  @Column({ type: DataType.STRING(320), allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare shopLocation: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare address: string;

  @ForeignKey(() => Campaign)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare campaignId: number;

  @ForeignKey(() => QrMapping)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare qrMappingId: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare acceptTerms: boolean;

  @BelongsTo(() => Campaign)
  declare campaign?: Campaign;

  @BelongsTo(() => QrMapping)
  declare qrMapping?: QrMapping;

  @HasMany(() => Receipt)
  declare receipts?: Receipt[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
