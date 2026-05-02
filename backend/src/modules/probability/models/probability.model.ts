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
import { Prize } from '../../prize-config/models/prize.model';

@Table({ tableName: 'probabilities', underscored: true })
export class Probability extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @ForeignKey(() => Campaign)
  @Column(DataType.INTEGER.UNSIGNED)
  declare campaignId: number;

  @ForeignKey(() => Prize)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  declare prizeId: number | null;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare weight: number;

  @BelongsTo(() => Campaign)
  declare campaign?: Campaign;

  @BelongsTo(() => Prize)
  declare prize?: Prize;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
