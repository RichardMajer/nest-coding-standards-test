import { Controller, Get, Post, Body } from '@nestjs/common';

// Správny príklad controller súboru
export interface IUserDto {
  id: number;
  name: string;
  email: string;
}

export interface ICreateUserDto {
  name: string;
  email: string;
}

@Controller('users')
export class UserController {
  @Get()
  findAll(): Promise<IUserDto[]> {
    return Promise.resolve([]);
  }

  @Post()
  create(@Body() createUserDto: ICreateUserDto): Promise<IUserDto> {
    return Promise.resolve({ id: 1, name: 'Test', email: 'test@example.com' });
  }
}