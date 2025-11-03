import { IsNumber, IsOptional, IsObject } from 'class-validator';

export class SaveProgressDto {
  @IsNumber()
  currentStep: number;

  @IsOptional()
  @IsObject()
  businessProfile?: any;

  @IsOptional()
  @IsObject()
  voiceAgentConfig?: any;

  @IsOptional()
  @IsObject()
  collectionFields?: any;

  @IsOptional()
  @IsObject()
  emergencyHandling?: any;

  @IsOptional()
  @IsObject()
  emailConfig?: any;

  @IsOptional()
  @IsObject()
  stepEvent?: {
    step: number;
    action: string;
    timeSpentSeconds: number;
  };
}

