import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EmailService {
  private mailchimpApiKey: string = '';
  private mailchimpServerPrefix: string = '';
  private mailchimpAudienceId: string = '';
  private adminEmail: string = '';
  private isInitialized: boolean = false;

  constructor(private configService: ConfigService) {
    this.init();
  }

  private init() {
    this.mailchimpApiKey = this.configService.get<string>('MAILCHIMP_API_KEY') || '';
    this.mailchimpServerPrefix =
      this.configService.get<string>('MAILCHIMP_SERVER_PREFIX') || '';
    this.mailchimpAudienceId = this.configService.get<string>(
      'MAILCHIMP_AUDIENCE_ID',
    ) || '';
    this.adminEmail =
      this.configService.get<string>('ADMIN_EMAIL') || 'azmain@sherpaprompt.com';

    if (this.mailchimpApiKey && this.mailchimpServerPrefix) {
      this.isInitialized = true;
      console.log(
        `✅ [EmailService] Mailchimp Marketing API initialized with server: ${this.mailchimpServerPrefix}`,
      );
    } else {
      console.warn(
        '⚠️ [EmailService] Mailchimp API key or server prefix not configured',
      );
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Send admin notification email via Mailchimp Marketing API
   */
  async sendAdminNotification(submissionData: any): Promise<any> {
    if (!this.isReady()) {
      throw new Error('Email service not initialized');
    }

    try {
      const { businessName, businessEmail, businessOwner, submissionId } =
        submissionData;

      // Create HTML content for admin notification
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Voice Agent Onboarding</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #18181b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #18181b; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .logo { font-size: 24px; font-weight: bold; }
        code { background-color: #e4e4e7; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🤖 4Trades Voice Agent Onboarding</div>
        <p>New Business Submission</p>
    </div>
    
    <div class="content">
        <h2>New Onboarding Submission</h2>
        
        <p><strong>${businessName}</strong> has completed their voice agent onboarding. Please review and set up their agent.</p>
        
        <div class="info-box">
            <h3>Business Information</h3>
            <ul>
                <li><strong>Business Name:</strong> ${businessName}</li>
                <li><strong>Owner:</strong> ${businessOwner}</li>
                <li><strong>Contact Email:</strong> ${businessEmail}</li>
                <li><strong>Submission ID:</strong> <code>${submissionId}</code></li>
            </ul>
        </div>
        
        <div class="info-box">
            <h3>📋 Next Steps</h3>
            <ol>
                <li>Review submission in MongoDB</li>
                <li>Set up voice agent configuration</li>
                <li>Purchase Twilio number</li>
                <li>Deploy agent to ahca-server</li>
                <li>Contact business owner with phone number</li>
            </ol>
        </div>
        
        <div class="info-box">
            <h3>💾 MongoDB Query</h3>
            <p>Database: <code>vasop</code></p>
            <p>Collection: <code>onboardings</code></p>
            <p>Query: <code>{ submissionId: "${submissionId}" }</code></p>
        </div>
        
        <p><strong>Expected Setup Time:</strong> 2-3 business days</p>
    </div>
</body>
</html>
      `.trim();

      const textContent = `
4Trades Voice Agent Onboarding - New Business Submission

New Onboarding Submission

${businessName} has completed their voice agent onboarding. Please review and set up their agent.

BUSINESS INFORMATION:
• Business Name: ${businessName}
• Owner: ${businessOwner}
• Contact Email: ${businessEmail}
• Submission ID: ${submissionId}

NEXT STEPS:
1. Review submission in MongoDB
2. Set up voice agent configuration
3. Purchase Twilio number
4. Deploy agent to ahca-server
5. Contact business owner with phone number

MONGODB QUERY:
Database: vasop
Collection: onboardings
Query: { submissionId: "${submissionId}" }

Expected Setup Time: 2-3 business days
      `.trim();

      // Send email to admin
      const result = await this.sendViaMailchimpMarketing(
        {
          email: this.adminEmail,
          name: 'Admin',
        },
        htmlContent,
        textContent,
        `New Voice Agent Onboarding: ${businessName}`,
      );

      return result;
    } catch (error) {
      console.error('❌ [EmailService] Error sending admin notification:', error);
      throw error;
    }
  }

  /**
   * Send email via Mailchimp Marketing API
   */
  private async sendViaMailchimpMarketing(
    userInfo: any,
    htmlContent: string,
    textContent: string,
    customSubject: string,
  ): Promise<any> {
    try {
      const fetch = (await import('node-fetch')).default;

      console.log('📧 [EmailService] Sending email via Mailchimp Marketing API...');

      // Step 1: Check if member exists, if not add them
      const audienceId = this.mailchimpAudienceId;

      if (!audienceId) {
        throw new Error('Mailchimp audience ID not configured');
      }

      const memberHash = crypto
        .createHash('md5')
        .update(userInfo.email.toLowerCase())
        .digest('hex');

      try {
        // Try to get the member
        const memberResponse = await fetch(
          `https://${this.mailchimpServerPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${memberHash}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.mailchimpApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!memberResponse.ok && memberResponse.status === 404) {
          // Member doesn't exist, add them
          console.log('📧 [EmailService] Adding new member to audience...');
          const addMemberResponse = await fetch(
            `https://${this.mailchimpServerPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${this.mailchimpApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email_address: userInfo.email,
                status: 'subscribed',
                merge_fields: {
                  FNAME: userInfo.name.split(' ')[0] || '',
                  LNAME: userInfo.name.split(' ').slice(1).join(' ') || '',
                },
              }),
            },
          );

          if (!addMemberResponse.ok) {
            const error = await addMemberResponse.json();
            console.error('❌ [EmailService] Failed to add member:', error);
            throw new Error(`Failed to add member: ${error.detail}`);
          }
          console.log('✅ [EmailService] Member added to audience');
        }
      } catch (error) {
        console.error('❌ [EmailService] Error checking/adding member:', error);
        throw new Error(`Member management failed: ${error.message}`);
      }

      // Step 2: Create a campaign
      const campaignData = {
        type: 'regular',
        recipients: {
          list_id: audienceId,
          segment_opts: {
            match: 'any',
            conditions: [
              {
                condition_type: 'EmailAddress',
                field: 'EMAIL',
                op: 'is',
                value: userInfo.email,
              },
            ],
          },
        },
        settings: {
          subject_line: customSubject,
          from_name: '4Trades Onboarding',
          reply_to: userInfo.email, // Use recipient's own email for reply_to
          title: `Notification - ${Date.now()}`,
        },
      };

      console.log('📧 [EmailService] Creating campaign...');
      const campaignResponse = await fetch(
        `https://${this.mailchimpServerPrefix}.api.mailchimp.com/3.0/campaigns`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.mailchimpApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(campaignData),
        },
      );

      if (!campaignResponse.ok) {
        const error = await campaignResponse.json();
        console.error('❌ [EmailService] Failed to create campaign:', error);
        throw new Error(`Campaign creation failed: ${error.detail}`);
      }

      const campaign = await campaignResponse.json();
      console.log('✅ [EmailService] Campaign created:', campaign.id);

      // Step 3: Set campaign content
      const contentData = {
        html: htmlContent,
        plain_text: textContent,
      };

      const contentResponse = await fetch(
        `https://${this.mailchimpServerPrefix}.api.mailchimp.com/3.0/campaigns/${campaign.id}/content`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.mailchimpApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contentData),
        },
      );

      if (!contentResponse.ok) {
        const error = await contentResponse.json();
        console.error('❌ [EmailService] Failed to set campaign content:', error);
        throw new Error(`Content setting failed: ${error.detail}`);
      }

      console.log('✅ [EmailService] Campaign content set');

      // Step 4: Send the campaign
      const sendResponse = await fetch(
        `https://${this.mailchimpServerPrefix}.api.mailchimp.com/3.0/campaigns/${campaign.id}/actions/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.mailchimpApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!sendResponse.ok) {
        const error = await sendResponse.json();
        console.error('❌ [EmailService] Failed to send campaign:', error);
        throw new Error(`Campaign sending failed: ${error.detail}`);
      }

      console.log('✅ [EmailService] Campaign sent successfully!');
      console.log('📧 [EmailService] Email sent to:', userInfo.email);
      console.log('📧 [EmailService] Subject:', customSubject);

      return {
        success: true,
        messageId: campaign.id,
        status: 'sent',
        email: userInfo.email,
        provider: 'mailchimp-marketing',
        campaignId: campaign.id,
      };
    } catch (error) {
      console.error('❌ [EmailService] Error sending via Mailchimp Marketing:', error);
      throw error;
    }
  }

  /**
   * Test email service connectivity
   */
  async testConnection(): Promise<any> {
    if (!this.isReady()) {
      return { success: false, error: 'Email service not initialized' };
    }

    try {
      const fetch = (await import('node-fetch')).default;

      const response = await fetch(
        `https://${this.mailchimpServerPrefix}.api.mailchimp.com/3.0/ping`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.mailchimpApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [EmailService] Mailchimp Marketing API connection test successful');
        return {
          success: true,
          provider: 'Mailchimp Marketing',
          ping: data.health_status || 'PONG',
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [EmailService] Connection test failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

