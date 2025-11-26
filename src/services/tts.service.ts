import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('✅ OpenAI TTS initialized');
    } else {
      this.logger.warn('⚠️  OPENAI_API_KEY not configured');
    }
  }

  async generateSpeech(text: string, voice: string): Promise<Buffer> {
    if (!this.openai) {
      this.logger.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    try {
      this.logger.log(
        `Generating speech with voice: ${voice}, text length: ${text.length}`,
      );

      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as any,
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      this.logger.log(
        `✅ Speech generated successfully, buffer size: ${buffer.length}`,
      );
      return buffer;
    } catch (error: any) {
      this.logger.error('TTS Error:', error);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }

  async checkContentModeration(
    text: string,
  ): Promise<{ isAppropriate: boolean; reason?: string }> {
    const apiKey = this.configService.get<string>('PROFANITY_API_KEY');
    if (!apiKey) {
      this.logger.warn('Profanity API key not configured, allowing content');
      return { isAppropriate: true };
    }

    try {
      this.logger.log(
        `Checking content moderation for text length: ${text.length}`,
      );

      // Use API Ninjas Profanity Filter API
      const response = await fetch(
        `https://api.api-ninjas.com/v1/profanityfilter?text=${encodeURIComponent(text)}`,
        {
          method: 'GET',
          headers: {
            'X-Api-Key': apiKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = (await response.json()) as {
        has_profanity: boolean;
        censored: string;
        original: string;
      };

      if (result.has_profanity) {
        const reason = 'Contains inappropriate or profane language';
        this.logger.log(`Moderation flagged: ${reason}`);
        return { isAppropriate: false, reason };
      }

      this.logger.log('Moderation passed');
      return { isAppropriate: true };
    } catch (error) {
      this.logger.error('Content moderation error:', error);
      // On error, allow the content (fail open)
      return { isAppropriate: true };
    }
  }
}
