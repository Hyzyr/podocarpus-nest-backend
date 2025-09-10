import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/_helpers/jwt-auth.guard';
import { InvestmentsService } from './investments.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, RolesGuard } from 'src/auth/roles';
import { BindInvestmentDto, PublicPropertyDto } from './dto/investments.dto';

@ApiTags('investments')
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // only allowed for Investors
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my')
  @Roles('investor')
  @ApiOperation({ summary: 'Get Investors Properties' })
  @ApiResponse({
    status: 200,
    description: 'Property created successfully.',
    type: [PublicPropertyDto],
  })
  getMyProperties(@Req() req) {
    return this.investmentsService.findInvestorProperties(req.user.userId);
  }

  @Post('bind')
  //   @Roles('admin')
  @ApiOperation({ summary: 'Bind a property to current Investor' })
  @ApiResponse({
    status: 200,
    description: 'Property successfully bound to investor',
    type: PublicPropertyDto,
  })
  async bindInvestmentTo(
    @Req() req,
    @Body() dto: BindInvestmentDto, 
  ) {
    return this.investmentsService.bindInvestmentTo(
      req.user.userId,
      dto.propertyId,
    );
  }
}
