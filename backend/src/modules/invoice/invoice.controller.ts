import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionKey } from '../rbac/constants/permission-keys';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-status.dto';
import { InvoiceService } from './invoice.service';

@Controller('admin/invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.FulfillmentProcess)
  getInvoices(@Query() filters: FilterInvoiceDto) {
    return this.invoiceService.getInvoices(filters);
  }

  @Get('summary')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.FulfillmentProcess)
  getInvoiceSummary() {
    return this.invoiceService.getInvoiceSummary();
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permissions(PermissionKey.FulfillmentProcess)
  updateInvoiceStatus(
    @Param('id', ParseIntPipe) participationId: number,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.invoiceService.updateInvoiceStatus(participationId, dto);
  }
}
