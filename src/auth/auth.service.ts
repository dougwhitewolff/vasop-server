import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
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
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
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
}

