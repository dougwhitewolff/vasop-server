import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { Onboarding, OnboardingSchema } from '../schemas/onboarding.schema';
import { EmailService } from '../services/email.service';
import { TtsService } from '../services/tts.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Onboarding.name, schema: OnboardingSchema },
    ]),
    AuthModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService, EmailService, TtsService],
})
export class OnboardingModule {}

