import { Controller, Get, Post, Body } from '@nestjs/common';

// Zlý príklad - súbor by mal začínať veľkým písmenom
export interface UserDto {  // Zlý príklad - interface by mal začínať "I"
  id: number;
  name: string;
}


@Controller('bad')
export class BadController {
  @Get()
  findAll() {  // Zlý príklad - chýba return type
    return [];
  }

  @Post()
  create(): string {  // Zlý príklad - primitive return type
    return 'created';
  }

  @Get('count')
  getCount(): number {  // Zlý príklad - primitive return type
    return 42;
  }
}
