import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { SupabaseService } from './supabase.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseService],
})
export class AppModule {}
