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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AppointmentService } from './services/appointments.service';
import {
  AppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { CurrentUser } from 'src/common/decorators/user.decorator';

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

  @UseGuards(RolesGuard)
  @Get()
  @ApiOperation({ summary: 'Get all appointments for a current user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'List of appointments for user',
    type: [AppointmentDto],
  })
  getAllForCurrentUser(@CurrentUser() user: CurrentUser) {
    return this.appointmentService.findAllForUser(user.userId);
  }

  @UseGuards(RolesGuard)
  @Get('user/:userId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all appointments for a specific user' })
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
  @Get('property/:propertyId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all appointments for a specific property' })
  @ApiParam({ name: 'propertyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'List of appointments for property',
    type: [AppointmentDto],
  })
  findAllForProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.appointmentService.findAllForProperty(propertyId);
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

  @UseGuards(RolesGuard)
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete an appointment by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.remove(id);
  }
}
