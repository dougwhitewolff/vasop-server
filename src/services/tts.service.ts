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
      this.logger.log(`Generating speech with voice: ${voice}, text length: ${text.length}`);
      
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as any,
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      this.logger.log(`✅ Speech generated successfully, buffer size: ${buffer.length}`);
      return buffer;
    } catch (error) {
      this.logger.error('TTS Error:', error);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }
}

