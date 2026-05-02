import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Campaign } from '../campaign/campaign.model';
import { Lead } from '../lead/models/lead.model';
import { Product } from '../product/product.model';
import { SpinResult } from '../spin/models/spin-result.model';
import { ParticipationStatus } from './participation-status.enum';

@Table({
  tableName: 'participations',
  underscored: true,
})
export class Participation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare userId: number;

  @ForeignKey(() => Campaign)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare campaignId: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare productId: number;

  @Column({
    type: DataType.ENUM(...Object.values(ParticipationStatus)),
    allowNull: false,
    defaultValue: ParticipationStatus.PENDING,
  })
  declare status: ParticipationStatus;

  @Column({ type: DataType.STRING(128), allowNull: true, unique: true })
  declare invoiceNumber: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare verifiedAt: Date | null;

  @Column({ type: DataType.STRING(32), allowNull: true })
  declare fulfillmentStatus: ParticipationStatus | null;

  @Column({ type: DataType.STRING(128), allowNull: true })
  declare trackingId: string | null;

  @Column({ type: DataType.STRING(128), allowNull: true })
  declare deliveryPartner: string | null;

  @Column({ type: DataType.STRING(512), allowNull: true })
  declare address: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare confirmedAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare dispatchDate: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deliveryDate: Date | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isLocked: boolean;

  @BelongsTo(() => Campaign)
  declare campaign?: Campaign;

  @BelongsTo(() => Product)
  declare product?: Product;

  @BelongsTo(() => Lead, { foreignKey: 'userId', targetKey: 'id' })
  declare lead?: Lead;

  @HasOne(() => SpinResult, { foreignKey: 'participationId', sourceKey: 'id' })
  declare spinResult?: SpinResult;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
