import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AppointmentService } from './services/appointments.service';
import {
  AppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UserActionsStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@ApiTags('appointments')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({
    status: 201,
    description: 'Appointment created successfully',
    type: AppointmentDto,
  })
  create(
    @CurrentUser() user: CurrentUser,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ) {
    return this.appointmentService.create(user, createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of appointments for current user',
    type: [AppointmentDto],
  })
  getAllForCurrentUser(@CurrentUser() user: CurrentUser) {
    return this.appointmentService.findAllForUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Appointment details',
    type: AppointmentDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('admin', 'investor', 'broker')
  @ApiOperation({ summary: 'Update an appointment by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Appointment updated successfully',
    type: AppointmentDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.appointmentService.update(id, updateAppointmentDto, user);
  }

  // ==================== Admin Only Routes ====================

  @UseGuards(RolesGuard)
  @Get('admin/all')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '[Admin Only] Get all appointments' })
  @ApiResponse({
    status: 200,
    description: 'List of all appointments',
    type: [AppointmentDto],
  })
  findAll() {
    return this.appointmentService.findAll();
  }

  @UseGuards(RolesGuard)
  @Get('admin/search')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '[Admin Only] Search appointments with filters' })
  @ApiQuery({ name: 'status', required: false, enum: UserActionsStatus })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Filtered list of appointments',
    type: [AppointmentDto],
  })
  searchAppointments(
    @Query('status') status?: UserActionsStatus,
    @Query('propertyId') propertyId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.appointmentService.findAllWithFilters({
      status,
      propertyId,
      userId,
    });
  }

  @UseGuards(RolesGuard)
  @Get('admin/statistics')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '[Admin Only] Get appointment statistics' })
  @ApiResponse({
    status: 200,
    description: 'Appointment statistics including counts by status and top properties',
  })
  getStatistics() {
    return this.appointmentService.getStatistics();
  }

  @UseGuards(RolesGuard)
  @Get('admin/user/:userId')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '[Admin Only] Get all appointments for a specific user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'List of appointments for user',
    type: [AppointmentDto],
  })
  findAllForUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.appointmentService.findAllForUser(userId);
  }

  @UseGuards(RolesGuard)
  @Get('admin/property/:propertyId')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '[Admin Only] Get all appointments for a specific property' })
  @ApiParam({ name: 'propertyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'List of appointments for property',
    type: [AppointmentDto],
  })
  findAllForProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.appointmentService.findAllForProperty(propertyId);
  }

  @UseGuards(RolesGuard)
  @Delete(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '[Admin Only] Delete an appointment by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.remove(id);
  }

  // ==================== End Admin Only Routes ====================
}
