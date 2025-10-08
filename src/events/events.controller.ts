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
import { EventsService } from './events.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/_helpers/jwt-auth.guard';
import { CurrentUser } from 'src/_helpers/user.decorator';
import { CreateEventDto, EventDto, EventIdParamDto, EventWithStatusDto, UpdateEventDto } from './dto/events.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully.',
    type: EventDto,
  })
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create({
      ...dto,
      startsAt: dto?.startsAt ? new Date(dto.startsAt) : dto?.startsAt,
      endsAt: dto?.endsAt ? new Date(dto.endsAt) : dto?.endsAt,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of events' })
  @ApiResponse({
    status: 200,
    description: 'List of events retrieved successfully.',
    type: [EventWithStatusDto],
  })
  findAll(@CurrentUser() user: CurrentUser) {
    return this.eventsService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully.',
    type: EventDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  findOne(@Param() { id }: EventIdParamDto) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully.',
    type: EventDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  update(@Param() { id }: EventIdParamDto, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Event by ID' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  remove(@Param() { id }: EventIdParamDto) {
    return this.eventsService.remove(id);
  }
}
