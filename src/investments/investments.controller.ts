import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/_helpers/jwt-auth.guard';
import { InvestmentsService } from './investments.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, RolesGuard } from 'src/auth/roles';
import { BindInvestmentDto, InvestorPropertyDto } from './dto/investments.dto';
import { CurrentUser } from 'src/_helpers/user.decorator';

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
    type: [InvestorPropertyDto],
  })
  getMyProperties(@CurrentUser() user: CurrentUser) {
    return this.investmentsService.findInvestorProperties(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bind')
  //   @Roles('admin')
  @ApiOperation({ summary: 'Bind a property to current Investor' })
  @ApiResponse({
    status: 201,
    description: 'Property successfully bound to investor',
    type: [InvestorPropertyDto],
  })
  async bindInvestmentTo(
    @CurrentUser() user: CurrentUser,
    @Body() dto: BindInvestmentDto,
  ) {
    return this.investmentsService.bindInvestmentTo(
      user.userId,
      dto.propertyId,
    );
  }
}
