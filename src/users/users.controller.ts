import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/_helpers/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { AdminUserDto, AdminUserWithRelationsDto, UserIdParamDto } from './dto/user.get.dto';

@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Controller('users')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ ADMIN routes (secured)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('/all')
  @ApiOperation({ summary: 'Get a list of all users [AdminOnly]' })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully.',
    type: [AdminUserDto],
  })
  getAll() {
    return this.usersService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('/full-info/:id')
  @ApiOperation({ summary: 'Get a single user with full info [AdminOnly]' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully.',
    type: AdminUserWithRelationsDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOneFullInfo(@Param() { id }: UserIdParamDto) {
    return this.usersService.findOneFullInfo(id);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin', 'superadmin')
  // @Post()
  // @ApiOperation({ summary: 'Create a new user [AdminOnly]' })
  // create(@Body() body: AdminUserDto) {
  //   return this.usersService.create(body);
  // }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing user [AdminOnly]' })
  update(@Param() { id }: UserIdParamDto, @Body() body: Partial<AdminUserDto>) {
    return this.usersService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove a user [AdminOnly]' })
  remove(@Param() { id }: UserIdParamDto) {
    return this.usersService.remove(id);
  }
}
