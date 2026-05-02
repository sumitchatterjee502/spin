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

@Table({ tableName: 'prize_configs', underscored: true })
export class PrizeConfig extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @ForeignKey(() => Campaign)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, unique: true })
  declare campaignId: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare maxPerDay: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare maxPerUser: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare totalLimit: number;

  @BelongsTo(() => Campaign)
  declare campaign?: Campaign;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
