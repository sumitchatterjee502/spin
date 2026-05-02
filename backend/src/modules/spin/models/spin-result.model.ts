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
import { Participation } from '../../participation/participation.model';
import { Prize } from '../../prize-config/models/prize.model';

export enum SpinOutcome {
  WIN = 'WIN',
  LOSE = 'LOSE',
}

@Table({
  tableName: 'spin_results',
  underscored: true,
  updatedAt: false,
})
export class SpinResult extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @ForeignKey(() => Participation)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, unique: true })
  declare participationId: number;

  @Column({
    type: DataType.ENUM(...Object.values(SpinOutcome)),
    allowNull: false,
  })
  declare result: SpinOutcome;

  @ForeignKey(() => Prize)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  declare prizeId: number | null;

  @BelongsTo(() => Participation)
  declare participation?: Participation;

  @BelongsTo(() => Prize)
  declare prize?: Prize;

  @CreatedAt
  declare createdAt: Date;
}
