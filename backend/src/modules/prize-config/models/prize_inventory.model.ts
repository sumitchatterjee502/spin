import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Campaign } from '../../campaign/campaign.model';
import { Prize } from './prize.model';

@Table({ tableName: 'prize_inventories', underscored: true, timestamps: false })
export class PrizeInventory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @ForeignKey(() => Campaign)
  @Column(DataType.INTEGER.UNSIGNED)
  declare campaignId: number;

  @ForeignKey(() => Prize)
  @Column(DataType.INTEGER.UNSIGNED)
  declare prizeId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare stock: number;

  @BelongsTo(() => Campaign)
  declare campaign?: Campaign;

  @BelongsTo(() => Prize)
  declare prize?: Prize;
}
