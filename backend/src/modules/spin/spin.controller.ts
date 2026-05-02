import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SkipStandardResponse } from '../../common/decorators/skip-standard-response.decorator';
import { SpinRequestDto } from './dto/spin-request.dto';
import { SpinService } from './spin.service';

@Controller('spin')
export class SpinController {
  constructor(private readonly spinService: SpinService) {}

  @Public()
  @SkipStandardResponse()
  @Post()
  @HttpCode(HttpStatus.OK)
  spin(@Body() dto: SpinRequestDto) {
    return this.spinService.spinWheel(dto.participationId);
  }
}
