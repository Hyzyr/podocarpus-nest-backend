import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/_helpers/jwt-auth.guard';
import { CurrentUser } from 'src/_helpers/user.decorator';
import { UserEventStatusService } from './event.status.service';
import { CreateEventStatusDto, UpdateUserEventStatusDto, UserEventStatusDto } from './dto/event.status.dto';
import { EventIdParamDto } from './dto/events.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('events-status')
@Controller('events-status')
export class UserEventStatusController {
  constructor(private readonly eventsStatusService: UserEventStatusService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new EventStatus' })
  @ApiResponse({
    status: 201,
    description: 'EventStatus created successfully.',
    type: CreateEventStatusDto,
  })
  create(@Body() dto: CreateEventStatusDto) {
    return this.eventsStatusService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of eventStatuses' })
  @ApiResponse({
    status: 200,
    description: 'List of eventStatuses retrieved successfully.',
    type: [UserEventStatusDto],
  })
  findAll(@CurrentUser() user: CurrentUser) {
    return this.eventsStatusService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single eventStatus by ID' })
  @ApiResponse({
    status: 200,
    description: 'EventStatus retrieved successfully.',
    type: UserEventStatusDto,
  })
  @ApiResponse({ status: 404, description: 'EventStatus not found.' })
  findOne(@Param() { id }: EventIdParamDto) {
    return this.eventsStatusService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a eventStatus by ID' })
  @ApiResponse({
    status: 200,
    description: 'EventStatus updated successfully.',
    type: UserEventStatusDto,
  })
  @ApiResponse({ status: 404, description: 'EventStatus not found.' })
  update(
    @Param() { id }: EventIdParamDto,
    @Body() dto: UpdateUserEventStatusDto,
  ) {
    return this.eventsStatusService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Event by ID' })
  @ApiResponse({
    status: 200,
    description: 'EventStatus deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'EventStatus not found.' })
  remove(@Param() { id }: EventIdParamDto) {
    return this.eventsStatusService.remove(id);
  }
}
