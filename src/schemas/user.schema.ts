import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: 'business_owner' })
  role: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  lastLoginAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes
UserSchema.index({ email: 1 }, { unique: true });

