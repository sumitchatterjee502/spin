import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipStandardResponse } from '../../common/decorators/skip-standard-response.decorator';
import { PermissionKey } from '../rbac/constants/permission-keys';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { ApproveVerificationDto } from './dto/approve-verification.dto';
import { FilterVerificationDto } from './dto/filter-verification.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { VerificationService } from './verification.service';

@Controller('admin/verifications')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.VerificationRead)
  @SkipStandardResponse()
  getWinningVerificationEntries(@Query() filters: FilterVerificationDto) {
    return this.verificationService.getWinningVerificationEntries(filters);
  }

  @Post(':id/approve')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.VerificationRead)
  approveSubmission(
    @Param('id', ParseIntPipe) participationId: number,
    @Body() dto: ApproveVerificationDto,
  ) {
    return this.verificationService.approveSubmission(participationId, dto);
  }

  @Post(':id/reject')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.VerificationRead)
  rejectSubmission(
    @Param('id', ParseIntPipe) participationId: number,
    @Body() dto: RejectVerificationDto,
  ) {
    return this.verificationService.rejectSubmission(participationId, dto);
  }
}
