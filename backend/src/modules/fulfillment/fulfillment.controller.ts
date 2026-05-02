import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionKey } from '../rbac/constants/permission-keys';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { ConfirmWinnerDto } from './dto/confirm-winner.dto';
import { DispatchPrizeDto } from './dto/dispatch-prize.dto';
import { FilterFulfillmentDto } from './dto/filter-fulfillment.dto';
import { FulfillmentService } from './fulfillment.service';

@Controller('admin/fulfillment')
export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.FulfillmentProcess)
  getFulfillmentEntries(@Query() filters: FilterFulfillmentDto) {
    return this.fulfillmentService.getFulfillmentEntries(filters);
  }

  @Post(':id/confirm')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.FulfillmentProcess)
  confirmWinner(
    @Param('id', ParseIntPipe) participationId: number,
    @Body() dto: ConfirmWinnerDto,
  ) {
    return this.fulfillmentService.confirmWinner(participationId, dto);
  }

  @Post(':id/dispatch')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.FulfillmentProcess)
  dispatchPrize(
    @Param('id', ParseIntPipe) participationId: number,
    @Body() dto: DispatchPrizeDto,
  ) {
    return this.fulfillmentService.dispatchPrize(participationId, dto);
  }

  @Patch(':id/deliver')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.FulfillmentProcess)
  markAsDelivered(@Param('id', ParseIntPipe) participationId: number) {
    return this.fulfillmentService.markAsDelivered(participationId);
  }
}
