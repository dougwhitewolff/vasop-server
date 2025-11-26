import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { Otp, OtpDocument } from '../schemas/otp.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../services/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signup(signupDto: SignupDto): Promise<any> {
    const { name, email, password, phone } = signupDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('This email is already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new this.userModel({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'business_owner',
      emailVerified: false,
    });

    await user.save();

    // Generate JWT token
    const payload = { userId: user._id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException(
        'This email address is not registered. Please sign up to create an account.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password. Please try again.');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const payload = { userId: user._id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userObj: any = user.toObject();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: userObj.createdAt,
    };
  }

  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<any> {
    const { email } = forgotPasswordDto;

    // Check if user exists
    const user = await this.userModel.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security, but still return success
      return {
        success: true,
        message:
          'If an account exists with this email, you will receive a password reset code.',
      };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Delete any existing OTPs for this email (cleanup)
    await this.otpModel.deleteMany({ email, purpose: 'password_reset' });

    // Save OTP to database
    const otpDoc = new this.otpModel({
      email,
      otp,
      expiresAt,
      used: false,
      purpose: 'password_reset',
    });

    await otpDoc.save();

    // Send OTP email
    try {
      await this.emailService.sendPasswordResetOTP(email, otp, user.name);
      console.log(`✅ [AuthService] Password reset OTP sent to ${email}`);
    } catch (error) {
      console.error('❌ [AuthService] Failed to send OTP email:', error);
      // Don't throw error to user, but log it
      // Still return success to not reveal if user exists
    }

    return {
      success: true,
      message:
        'If an account exists with this email, you will receive a password reset code.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    const { email, otp, newPassword } = resetPasswordDto;

    // Find the OTP
    const otpDoc = await this.otpModel.findOne({
      email,
      otp,
      purpose: 'password_reset',
      used: false,
    });

    if (!otpDoc) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Check if OTP is expired
    if (new Date() > otpDoc.expiresAt) {
      throw new BadRequestException(
        'Reset code has expired. Please request a new one.',
      );
    }

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as your current password. Please choose a different password.',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Mark OTP as used
    otpDoc.used = true;
    await otpDoc.save();

    // Delete all OTPs for this user (cleanup)
    await this.otpModel.deleteMany({ email, purpose: 'password_reset' });

    console.log(`✅ [AuthService] Password reset successful for ${email}`);

    return {
      success: true,
      message:
        'Your password has been reset successfully. You can now log in with your new password.',
    };
  }
}
