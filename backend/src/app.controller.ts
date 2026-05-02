import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  health(): { message: string; responseData: { status: string } } {
    return {
      message: 'Spin Platform API is running',
      responseData: { status: 'ok' },
    };
  }
}
