import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { GetEventsQueryDto } from './dto/get-events-query.dto';
import { EventsService } from './events.service';

/**
 * 이벤트 컨트롤러
 */
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * 이벤트 생성
   */
  @Post()
  async createEvent(@Body() dto: CreateEventDto) {
    const event = await this.eventsService.createEvent(dto);

    return {
      success: true,
      data: event,
    };
  }

  /**
   * 이벤트 목록 조회
   */
  @Get()
  async getEvents(@Query() query: GetEventsQueryDto) {
    const result = await this.eventsService.getEvents(query);

    return {
      success: true,
      data: result,
    };
  }
}