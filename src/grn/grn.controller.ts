import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GrnService } from './grn.service';
import { CreateGrnDto } from './dto/create-grn.dto';
import { UpdateGrnDto } from './dto/update-grn.dto';
import { GetCurrentUserId } from '../decorators/get-current-user-id.decorator';

@Controller('grns')
export class GrnController {
  constructor(private readonly grnService: GrnService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateGrnDto, @GetCurrentUserId() userId?: string) {
    // Automatically use logged-in user if receivedBy not provided and user is authenticated
    const receivedBy = dto.receivedBy ?? userId ?? undefined;
    return this.grnService.create({ ...dto, receivedBy });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('q') q?: string,
    @Query('purchaseId') purchaseId?: string,
  ) {
    return this.grnService.findAll(Number(page), Number(limit), q, purchaseId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.grnService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGrnDto,
    @GetCurrentUserId() userId?: string,
  ) {
    // Automatically use logged-in user if receivedBy not provided in update and user is authenticated
    const receivedBy =
      dto.receivedBy !== undefined ? dto.receivedBy : (userId ?? undefined);
    return this.grnService.update(id, { ...dto, receivedBy });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.grnService.remove(id);
    return {};
  }
}
