import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignUserRoleDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  roleId!: number;
}
