import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Onboarding, OnboardingDocument } from '../schemas/onboarding.schema';
import { EmailService } from '../services/email.service';
import { SaveProgressDto } from './dto/save-progress.dto';
import { SubmitDto } from './dto/submit.dto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(Onboarding.name)
    private onboardingModel: Model<OnboardingDocument>,
    private emailService: EmailService,
  ) {}

  /**
   * Generate unique submission ID
   */
  private generateSubmissionId(): string {
    const date = new Date().toISOString().split('T')[0];
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `4t-${random}-${date}`;
  }

  /**
   * Save progress (draft - not submitted yet)
   */
  async saveProgress(userId: string, data: SaveProgressDto): Promise<any> {
    const now = new Date();

    try {
      // Try to find existing draft
      let submission = await this.onboardingModel.findOne({
        userId,
        isSubmitted: false,
      });

      if (!submission) {
        // Create new draft - MongoDB index ensures only one draft per user
        submission = new this.onboardingModel({
          submissionId: this.generateSubmissionId(),
          userId,
          status: 'draft',
          isSubmitted: false,
          currentStep: data.currentStep,
          lastSavedAt: now,
          behaviorTracking: {
            submissionStarted: now,
            submissionCompleted: null,
            stepEvents: [
              {
                step: data.currentStep,
                action: 'entered',
                timestamp: now,
                timeSpentSeconds: null,
              },
            ],
            totalTimeSpentSeconds: 0,
            numberOfSessions: 1,
            lastActiveAt: now,
          },
        });
      }

      // Update fields
      if (data.businessProfile) {
        submission.businessProfile = data.businessProfile as any;
      }
      if (data.voiceAgentConfig) {
        submission.voiceAgentConfig = data.voiceAgentConfig as any;
      }
      if (data.collectionFields) {
        if (!submission.voiceAgentConfig) {
          submission.voiceAgentConfig = {} as any;
        }
        (submission.voiceAgentConfig as any).collectionFields =
          data.collectionFields;
      }
      if (data.emergencyHandling) {
        if (!submission.voiceAgentConfig) {
          submission.voiceAgentConfig = {} as any;
        }
        (submission.voiceAgentConfig as any).emergencyHandling =
          data.emergencyHandling;
      }
      if (data.emailConfig) {
        submission.emailConfig = data.emailConfig as any;
      }

      submission.currentStep = data.currentStep;
      submission.lastSavedAt = now;

      // Track behavior
      if (!submission.behaviorTracking) {
        submission.behaviorTracking = {
          submissionStarted: now,
          submissionCompleted: null,
          stepEvents: [],
          totalTimeSpentSeconds: 0,
          numberOfSessions: 1,
          lastActiveAt: now,
        } as any;
      }
      submission.behaviorTracking.lastActiveAt = now;

      if (data.stepEvent) {
        submission.behaviorTracking.stepEvents.push({
          step: data.stepEvent.step,
          action: data.stepEvent.action,
          timestamp: now,
          timeSpentSeconds: data.stepEvent.timeSpentSeconds,
        } as any);
      }

      await submission.save();

      return {
        success: true,
        currentStep: submission.currentStep,
        lastSavedAt: submission.lastSavedAt,
        submissionId: submission.submissionId,
      };
    } catch (error) {
      // Handle duplicate key error from MongoDB index
      if (error.code === 11000) {
        const existing = await this.onboardingModel.findOne({
          userId,
          isSubmitted: false,
        });
        if (existing) {
          // Update the existing one
          Object.assign(existing, data);
          existing.currentStep = data.currentStep;
          existing.lastSavedAt = now;
          await existing.save();
          return {
            success: true,
            currentStep: existing.currentStep,
            lastSavedAt: existing.lastSavedAt,
            submissionId: existing.submissionId,
          };
        }
      }
      throw error;
    }
  }

  /**
   * Get user's submission (draft or submitted)
   */
  async getUserSubmission(userId: string): Promise<any> {
    // Find draft first, if not found, find submitted
    let submission = await this.onboardingModel.findOne({
      userId,
      isSubmitted: false,
    });

    if (!submission) {
      submission = await this.onboardingModel.findOne({
        userId,
        isSubmitted: true,
      });
    }

    if (!submission) {
      return null;
    }

    return {
      submission,
      status: submission.status,
      currentStep: submission.currentStep,
      isSubmitted: submission.isSubmitted,
      lastSavedAt: submission.lastSavedAt,
    };
  }

  /**
   * Final submission - triggers admin email
   */
  async submitOnboarding(userId: string, data: SubmitDto): Promise<any> {
    let submission = await this.onboardingModel.findOne({
      userId,
      isSubmitted: false,
    });

    if (!submission) {
      submission = new this.onboardingModel({
        submissionId: this.generateSubmissionId(),
        userId,
        behaviorTracking: {
          submissionStarted: new Date(),
          submissionCompleted: null,
          stepEvents: [],
          totalTimeSpentSeconds: 0,
          numberOfSessions: 1,
          lastActiveAt: new Date(),
        },
      });
    }

    const now = new Date();

    // Calculate total time spent
    const startTime = submission.behaviorTracking.submissionStarted.getTime();
    const endTime = now.getTime();
    const totalSeconds = Math.floor((endTime - startTime) / 1000);

    // Update with final data
    submission.businessProfile = data.businessProfile as any;
    submission.voiceAgentConfig = data.voiceAgentConfig as any;
    submission.emailConfig = data.emailConfig as any;
    submission.status = 'submitted';
    submission.isSubmitted = true;
    submission.submittedAt = now;
    submission.currentStep = 6;

    // Update behavior tracking
    submission.behaviorTracking.submissionCompleted = now;
    submission.behaviorTracking.totalTimeSpentSeconds = totalSeconds;
    submission.behaviorTracking.lastActiveAt = now;

    await submission.save();

    // Send email to admin via Mailchimp
    try {
      const emailResult = await this.emailService.sendAdminNotification({
        businessName: submission.businessProfile.businessName,
        businessEmail: submission.businessProfile.email,
        businessOwner: submission.businessProfile.businessName,
        submissionId: submission.submissionId,
      });

      submission.adminNotification = {
        emailSent: emailResult.success,
        sentAt: new Date(),
        sentTo: 'doug@sherpaprompt.com',
        mailchimpCampaignId: emailResult.campaignId || null,
      } as any;

      await submission.save();
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error);
      submission.adminNotification = {
        emailSent: false,
        sentAt: new Date(),
        sentTo: 'doug@sherpaprompt.com',
        mailchimpCampaignId: null,
      } as any;
      await submission.save();
    }

    return {
      success: true,
      submissionId: submission.submissionId,
      message:
        'Your info has been successfully submitted. Admin will review and contact you soon.',
    };
  }
}

