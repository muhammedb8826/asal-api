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
import { UomService } from './uom.service';
import { CreateUomDto, UpdateUomDto } from './dto';

@Controller('uoms')
export class UomController {
  constructor(private readonly uomService: UomService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUomDto) {
    return this.uomService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('q') q?: string,
    @Query('unitCategoryId') unitCategoryId?: string,
  ) {
    return this.uomService.findAll(
      Number(page),
      Number(limit),
      q,
      unitCategoryId,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.uomService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() dto: UpdateUomDto) {
    return this.uomService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.uomService.remove(id);
    return {};
  }
}
