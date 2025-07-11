import { Redis } from "@upstash/redis";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import { db } from "@/db/drizzle";
import { user_settings, security_events } from "@/db/schema";
import { eq } from "drizzle-orm";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

export class TwoFactorAuth {
  // Encrypt sensitive data
  private static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  private static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Generate TOTP secret and QR code
  static async generateSecret(userId: string, userEmail: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    const secret = speakeasy.generateSecret({
      name: `Ozza (${userEmail})`,
      issuer: 'Ozza Platform',
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store encrypted secret temporarily (10 minutes)
    const tempData = {
      secret: secret.base32,
      backupCodes,
      userEmail,
    };
    
    await redis.setex(
      `2fa_setup:${userId}`, 
      600, // 10 minutes
      JSON.stringify(tempData)
    );

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  // Verify and enable 2FA
  static async enable2FA(
    userId: string, 
    token: string
  ): Promise<{ success: boolean; error?: string; backupCodes?: string[] }> {
    try {
      // Get temporary setup data
      const tempData = await redis.get(`2fa_setup:${userId}`);
      if (!tempData) {
        return { success: false, error: "Setup session expired. Please restart." };
      }

      const { secret, backupCodes } = JSON.parse(tempData as string);

      // Verify the TOTP token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps for clock drift
      });

      if (!verified) {
        return { success: false, error: "Invalid verification code" };
      }

      // Encrypt secret and backup codes
      const encryptedSecret = this.encrypt(secret);
      const encryptedBackupCodes = backupCodes.map((code: string) => this.encrypt(code));

      // Update user settings
      await db
        .update(user_settings)
        .set({
          twoFactorEnabled: true,
          otpSecret: encryptedSecret,
          backupCodes: encryptedBackupCodes,
          securityLevel: 'standard',
          updatedAt: new Date(),
        })
        .where(eq(user_settings.userId, userId));

      // Log security event
      await db.insert(security_events).values({
        userId,
        eventType: '2fa_enabled',
        eventDetails: { method: 'totp' },
        severity: 'info',
      });

      // Clean up temporary data
      await redis.del(`2fa_setup:${userId}`);

      return { success: true, backupCodes };
    } catch (error) {
      console.error('2FA enable error:', error);
      return { success: false, error: "Failed to enable 2FA" };
    }
  }

  // Verify TOTP token
  static async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      // Get user settings
      const [userSettings] = await db
        .select()
        .from(user_settings)
        .where(eq(user_settings.userId, userId))
        .limit(1);

      if (!userSettings?.twoFactorEnabled || !userSettings.otpSecret) {
        return false;
      }

      // Decrypt secret
      const secret = this.decrypt(userSettings.otpSecret);

      // Check if it's a backup code
      if (token.length === 8) {
        return await this.verifyBackupCode(userId, token, userSettings);
      }

      // Verify TOTP
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });

      if (verified) {
        // Log successful verification
        await db.insert(security_events).values({
          userId,
          eventType: '2fa_verified',
          eventDetails: { method: 'totp' },
          severity: 'info',
        });
      }

      return verified;
    } catch (error) {
      console.error('2FA verify error:', error);
      return false;
    }
  }

  // Verify backup code
  private static async verifyBackupCode(
    userId: string, 
    code: string, 
    userSettings: any
  ): Promise<boolean> {
    try {
      const backupCodes = userSettings.backupCodes || [];
      const normalizedCode = code.toUpperCase();

      // Check if code exists and decrypt
      const validCode = backupCodes.find((encryptedCode: string) => {
        try {
          return this.decrypt(encryptedCode) === normalizedCode;
        } catch {
          return false;
        }
      });

      if (!validCode) {
        return false;
      }

      // Remove used backup code
      const updatedCodes = backupCodes.filter((encryptedCode: string) => 
        encryptedCode !== validCode
      );

      await db
        .update(user_settings)
        .set({
          backupCodes: updatedCodes,
          updatedAt: new Date(),
        })
        .where(eq(user_settings.userId, userId));

      // Log backup code usage
      await db.insert(security_events).values({
        userId,
        eventType: '2fa_backup_code_used',
        eventDetails: { remainingCodes: updatedCodes.length },
        severity: 'warning',
      });

      return true;
    } catch (error) {
      console.error('Backup code verify error:', error);
      return false;
    }
  }

  // Disable 2FA
  static async disable2FA(userId: string, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify current token before disabling
      const verified = await this.verifyToken(userId, token);
      if (!verified) {
        return { success: false, error: "Invalid verification code" };
      }

      // Disable 2FA
      await db
        .update(user_settings)
        .set({
          twoFactorEnabled: false,
          otpSecret: null,
          backupCodes: [],
          securityLevel: 'basic',
          updatedAt: new Date(),
        })
        .where(eq(user_settings.userId, userId));

      // Log security event
      await db.insert(security_events).values({
        userId,
        eventType: '2fa_disabled',
        eventDetails: {},
        severity: 'warning',
      });

      return { success: true };
    } catch (error) {
      console.error('2FA disable error:', error);
      return { success: false, error: "Failed to disable 2FA" };
    }
  }

  // Get 2FA status
  static async getStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
    securityLevel: string;
  }> {
    try {
      const [userSettings] = await db
        .select()
        .from(user_settings)
        .where(eq(user_settings.userId, userId))
        .limit(1);

      if (!userSettings) {
        return {
          enabled: false,
          backupCodesRemaining: 0,
          securityLevel: 'basic',
        };
      }

      const backupCodes = userSettings.backupCodes || [];
      
      return {
        enabled: userSettings.twoFactorEnabled || false,
        backupCodesRemaining: Array.isArray(backupCodes) ? backupCodes.length : 0,
        securityLevel: userSettings.securityLevel || 'basic',
      };
    } catch (error) {
      console.error('2FA status error:', error);
      return {
        enabled: false,
        backupCodesRemaining: 0,
        securityLevel: 'basic',
      };
    }
  }

  // Generate new backup codes
  static async regenerateBackupCodes(userId: string, token: string): Promise<{
    success: boolean;
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      // Verify current token
      const verified = await this.verifyToken(userId, token);
      if (!verified) {
        return { success: false, error: "Invalid verification code" };
      }

      // Generate new backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      const encryptedBackupCodes = backupCodes.map(code => this.encrypt(code));

      // Update user settings
      await db
        .update(user_settings)
        .set({
          backupCodes: encryptedBackupCodes,
          updatedAt: new Date(),
        })
        .where(eq(user_settings.userId, userId));

      // Log security event
      await db.insert(security_events).values({
        userId,
        eventType: '2fa_backup_codes_regenerated',
        eventDetails: { newCodesCount: backupCodes.length },
        severity: 'info',
      });

      return { success: true, backupCodes };
    } catch (error) {
      console.error('Backup codes regeneration error:', error);
      return { success: false, error: "Failed to regenerate backup codes" };
    }
  }
}