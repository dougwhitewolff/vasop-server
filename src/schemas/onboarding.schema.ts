import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OnboardingDocument = Onboarding & Document;

@Schema({ _id: false })
export class Address {
  @Prop()
  street: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  zip: string;
}

@Schema({ _id: false })
export class BusinessHours {
  @Prop()
  mondayFriday: string;

  @Prop()
  saturday: string;

  @Prop()
  sunday: string;
}

@Schema({ _id: false })
export class BusinessProfile {
  @Prop()
  businessName: string;

  @Prop()
  industry: string;

  @Prop()
  website: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({ type: Address })
  address: Address;

  @Prop({ type: BusinessHours })
  hours: BusinessHours;
}

@Schema({ _id: false })
export class CustomField {
  @Prop()
  question: string;

  @Prop()
  required: boolean;
}

@Schema({ _id: false })
export class CollectionFields {
  @Prop({ default: true })
  name: boolean;

  @Prop({ default: true })
  phone: boolean;

  @Prop({ default: false })
  email: boolean;

  @Prop({ default: true })
  reason: boolean;

  @Prop({ default: false })
  urgency: boolean;

  @Prop({ default: false })
  propertyAddress: boolean;

  @Prop({ default: false })
  bestTimeToCallback: boolean;

  @Prop({ type: [CustomField], default: [] })
  customFields: CustomField[];
}

@Schema({ _id: false })
export class VoiceAgentConfig {
  @Prop()
  agentName: string;

  @Prop()
  agentPersonality: string;

  @Prop()
  greeting: string;

  @Prop({ default: 'ash' })
  voice: string;

  @Prop({ type: CollectionFields })
  collectionFields: CollectionFields;

  @Prop({ type: Object })
  emergencyHandling: {
    enabled: boolean;
    forwardToNumber?: string;
    triggerMethod?: string;
  };
}

@Schema({ _id: false })
export class EmailConfig {
  @Prop()
  recipientEmail: string;

  @Prop({ default: true })
  summaryEnabled: boolean;
}

@Schema({ _id: false })
export class AdminNotification {
  @Prop({ default: false })
  emailSent: boolean;

  @Prop()
  sentAt: Date;

  @Prop()
  sentTo: string;

  @Prop()
  mailchimpCampaignId: string;
}

@Schema({ _id: false })
export class StepEvent {
  @Prop()
  step: number;

  @Prop()
  action: string;

  @Prop()
  timestamp: Date;

  @Prop()
  timeSpentSeconds: number;
}

@Schema({ _id: false })
export class BehaviorTracking {
  @Prop()
  submissionStarted: Date;

  @Prop()
  submissionCompleted: Date;

  @Prop({ type: [StepEvent], default: [] })
  stepEvents: StepEvent[];

  @Prop({ default: 0 })
  totalTimeSpentSeconds: number;

  @Prop({ default: 1 })
  numberOfSessions: number;

  @Prop()
  lastActiveAt: Date;
}

@Schema({ timestamps: true })
export class Onboarding {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  submissionId: string;

  @Prop({ default: 'draft' })
  status: string;

  @Prop({ default: false })
  isSubmitted: boolean;

  @Prop()
  submittedAt: Date;

  @Prop({ default: 1 })
  currentStep: number;

  @Prop({ default: Date.now })
  lastSavedAt: Date;

  @Prop({ type: BusinessProfile })
  businessProfile: BusinessProfile;

  @Prop({ type: VoiceAgentConfig })
  voiceAgentConfig: VoiceAgentConfig;

  @Prop({ type: EmailConfig })
  emailConfig: EmailConfig;

  @Prop({ type: AdminNotification })
  adminNotification: AdminNotification;

  @Prop({ type: BehaviorTracking })
  behaviorTracking: BehaviorTracking;
}

export const OnboardingSchema = SchemaFactory.createForClass(Onboarding);

// Create indexes
OnboardingSchema.index({ submissionId: 1 }, { unique: true });
OnboardingSchema.index({ userId: 1 });
OnboardingSchema.index({ status: 1, submittedAt: -1 });

// Partial unique index: only one draft per user
OnboardingSchema.index(
  { userId: 1, isSubmitted: 1 },
  {
    unique: true,
    partialFilterExpression: { isSubmitted: false },
    name: 'one_draft_per_user',
  },
);

