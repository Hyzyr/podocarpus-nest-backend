import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  hello() {
    return 'Hello world';
  }

  @Get('/health')
  showStatus() {
    return { status: 'ok' };
  }
}
