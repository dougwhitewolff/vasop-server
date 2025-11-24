import { Controller, Post, Get, Body, UseGuards, Req, Res } from '@nestjs/common';
import { Request } from 'express';
import type { Response } from 'express';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { SaveProgressDto } from './dto/save-progress.dto';
import { SubmitDto } from './dto/submit.dto';
import { TtsService } from '../services/tts.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(
    private onboardingService: OnboardingService,
    private ttsService: TtsService,
  ) {}

  @Post('save')
  async saveProgress(@Req() req: Request & { user: any }, @Body() saveProgressDto: SaveProgressDto) {
    return this.onboardingService.saveProgress(
      req.user.userId,
      saveProgressDto,
    );
  }

  @Get('my-submission')
  async getMySubmission(@Req() req: Request & { user: any }) {
    const result = await this.onboardingService.getUserSubmission(req.user.userId);
    // Return empty object instead of null to prevent JSON parsing error
    return result || {};
  }

  @Post('submit')
  async submitOnboarding(@Req() req: Request & { user: any }, @Body() submitDto: SubmitDto) {
    return this.onboardingService.submitOnboarding(req.user.userId, submitDto);
  }

  @Public()
  @Post('preview-voice')
  async previewVoice(
    @Body() body: { text: string; voice: string },
    @Res() res: Response,
  ) {
    try {
      if (!body.text || !body.voice) {
        return res.status(400).json({ error: 'Text and voice are required' });
      }

      const audioBuffer = await this.ttsService.generateSpeech(body.text, body.voice);
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      });
      
      return res.send(audioBuffer);
    } catch (error) {
      console.error('Preview voice error:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate voice preview' });
    }
  }
}

