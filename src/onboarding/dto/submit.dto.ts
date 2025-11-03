import { IsObject, IsNotEmpty } from 'class-validator';

export class SubmitDto {
  @IsNotEmpty()
  @IsObject()
  businessProfile: any;

  @IsNotEmpty()
  @IsObject()
  voiceAgentConfig: any;

  @IsNotEmpty()
  @IsObject()
  emailConfig: any;
}

