import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfidentialClientApplication } from '@azure/msal-node';

@Injectable()
export class EmailService {
  private msalClient: ConfidentialClientApplication | null = null;
  private senderEmail: string = '';
  private fromName: string = '';
  private adminEmail: string = '';
  private isInitialized: boolean = false;

  constructor(private configService: ConfigService) {
    this.init();
  }

  private init() {
    const tenantId = this.configService.get<string>('BUSINESS_SHERPAPROMPT_TENANT_ID');
    const clientId = this.configService.get<string>('BUSINESS_SHERPAPROMPT_CLIENT_ID');
    const clientSecret = this.configService.get<string>('BUSINESS_SHERPAPROMPT_CLIENT_SECRET');
    this.senderEmail = this.configService.get<string>('BUSINESS_SHERPAPROMPT_SENDER_EMAIL') || '';
    this.adminEmail = this.configService.get<string>('ADMIN_EMAIL') || 'azmain@sherpaprompt.com';
    this.fromName = '4Trades Onboarding';

    if (tenantId && clientId && clientSecret && this.senderEmail) {
      try {
        const msalConfig = {
          auth: {
            clientId,
            authority: `https://login.microsoftonline.com/${tenantId}`,
            clientSecret,
          },
        };

        this.msalClient = new ConfidentialClientApplication(msalConfig);
        this.isInitialized = true;
        console.log(`✅ [EmailService] Microsoft Graph initialized`);
        console.log(`   📧 Sender Email: ${this.senderEmail}`);
        console.log(`   🔑 Client ID: ${clientId.substring(0, 8)}...`);
        console.log(`   🏢 Tenant ID: ${tenantId.substring(0, 8)}...`);
      } catch (error) {
        console.error('❌ [EmailService] Failed to initialize Microsoft Graph client:', error);
      }
    } else {
      console.warn('⚠️ [EmailService] Microsoft Graph credentials not configured');
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Send admin notification email via Microsoft Graph API
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

      // Send email to admin via Microsoft Graph
      const result = await this.sendViaMicrosoftGraph(
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
   * Send email via Microsoft Graph API
   */
  private async sendViaMicrosoftGraph(
    userInfo: any,
    htmlContent: string,
    textContent: string,
    customSubject: string,
  ): Promise<any> {
    try {
      if (!this.isInitialized || !this.msalClient) {
        throw new Error('Microsoft Graph not initialized');
      }

      const userName = userInfo.name || 'Admin';
      const subject = customSubject || 'New Voice Agent Onboarding';

      console.log('📧 [EmailService] Sending email via Microsoft Graph API...');
      console.log(`   📧 From: ${this.fromName} <${this.senderEmail}>`);
      console.log(`   📧 To: ${userInfo.email}`);
      console.log(`   📧 Subject: ${subject}`);

      // Step 1: Get OAuth2 access token
      const tokenRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
      };

      const authResponse = await this.msalClient.acquireTokenByClientCredential(tokenRequest);

      if (!authResponse || !authResponse.accessToken) {
        console.error('❌ [EmailService] Failed to acquire access token');
        throw new Error('Failed to acquire access token');
      }

      console.log('✅ [EmailService] Access token acquired');

      // Step 2: Prepare email message
      const message = {
        message: {
          subject: subject,
          body: {
            contentType: 'HTML',
            content: htmlContent,
          },
          toRecipients: [
            {
              emailAddress: {
                address: userInfo.email,
                name: userName,
              },
            },
          ],
        },
        saveToSentItems: 'true',
      };

      // Step 3: Send email via Microsoft Graph API
      const fetch = (await import('node-fetch')).default;
      const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${this.senderEmail}/sendMail`;

      const response = await fetch(graphEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authResponse.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EmailService] Microsoft Graph API error:', response.status, errorText);
        throw new Error(`Microsoft Graph API error: ${response.status} - ${errorText}`);
      }

      console.log('✅ [EmailService] Email sent successfully via Microsoft Graph!');
      console.log('📧 [EmailService] Email sent to:', userInfo.email);
      console.log('📧 [EmailService] Subject:', subject);

      return {
        success: true,
        messageId: `msg-${Date.now()}`,
        status: 'sent',
        email: userInfo.email,
        provider: 'microsoft-graph',
        campaignId: `msg-${Date.now()}`,
      };
    } catch (error) {
      console.error('❌ [EmailService] Error sending via Microsoft Graph:', error);
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
      if (!this.msalClient) {
        throw new Error('MSAL client not initialized');
      }

      // Step 1: Get OAuth2 access token
      const tokenRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
      };

      const authResponse = await this.msalClient.acquireTokenByClientCredential(tokenRequest);

      if (authResponse && authResponse.accessToken) {
        console.log('✅ [EmailService] Microsoft Graph connection test successful');
        return {
          success: true,
          provider: 'Microsoft Graph',
          tokenExpiry: authResponse.expiresOn,
        };
      } else {
        throw new Error('Failed to acquire access token');
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

