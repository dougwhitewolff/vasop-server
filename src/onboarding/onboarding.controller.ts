import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SaveProgressDto } from './dto/save-progress.dto';
import { SubmitDto } from './dto/submit.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Post('save')
  async saveProgress(@Req() req: Request & { user: any }, @Body() saveProgressDto: SaveProgressDto) {
    return this.onboardingService.saveProgress(
      req.user.userId,
      saveProgressDto,
    );
  }

  @Get('my-submission')
  async getMySubmission(@Req() req: Request & { user: any }) {
    return this.onboardingService.getUserSubmission(req.user.userId);
  }

  @Post('submit')
  async submitOnboarding(@Req() req: Request & { user: any }, @Body() submitDto: SubmitDto) {
    return this.onboardingService.submitOnboarding(req.user.userId, submitDto);
  }
}

