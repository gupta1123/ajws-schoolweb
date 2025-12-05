// src/lib/api/passwords.ts

import { apiClient } from './client';

export interface ResetPasswordRequest {
  user_id: string;
  new_password: string;
}

export interface BulkResetPasswordRequest {
  users: Array<{
    user_id: string;
    new_password: string;
  }>;
}

export interface BulkResetPasswordResponse {
  success: boolean;
  totalCount: number;
  successCount: number;
  failedCount: number;
  errors?: Array<{ user_id: string; error: string }>;
}

export const passwordServices = {
  /**
   * Reset password for a single user
   * @param token - Authentication token
   * @param userId - User ID to reset password for
   * @param newPassword - New password
   * @returns Promise<boolean> - Success status
   */
  resetPassword: async (
    token: string,
    userId: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      const response = await apiClient.put(
        '/api/auth/update-password',
        {
          user_id: userId,
          new_password: newPassword
        },
        token
      );

      // Handle different response formats
      if (response instanceof Blob) {
        return false;
      }

      if ('status' in response) {
        return response.status === 'success';
      }

      return false;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  },

  /**
   * Reset passwords for multiple users in bulk with individual passwords
   * @param token - Authentication token
   * @param userPasswords - Map of user IDs to their new passwords
   * @returns Promise<BulkResetPasswordResponse> - Bulk reset result
   */
  bulkResetPassword: async (
    token: string,
    userPasswords: Map<string, string>
  ): Promise<BulkResetPasswordResponse> => {
    try {
      // Prepare payload in the format: { users: [{ user_id, new_password }, ...] }
      const users = Array.from(userPasswords.entries()).map(([user_id, new_password]) => ({
        user_id,
        new_password
      }));

      const response = await apiClient.put(
        '/api/auth/bulk-update-passwords',
        {
          users
        },
        token
      );

      if (response instanceof Blob) {
        // If bulk endpoint doesn't exist, fall back to individual resets
        return await passwordServices.bulkResetPasswordFallback(token, userPasswords);
      }

      if ('status' in response && response.status === 'success') {
        // Check if response has data with success/failure counts
        if ('data' in response) {
          const data = response.data as {
            success_count?: number;
            failed_count?: number;
            errors?: Array<{ user_id: string; error: string }>;
          };
          return {
            success: (data.failed_count ?? 0) === 0,
            totalCount: users.length,
            successCount: data.success_count ?? users.length,
            failedCount: data.failed_count ?? 0,
            errors: data.errors ?? []
          };
        }
        // If no data field, assume all succeeded
        return {
          success: true,
          totalCount: users.length,
          successCount: users.length,
          failedCount: 0,
          errors: []
        };
      }

      // If response indicates error, fall back to individual resets
      return await passwordServices.bulkResetPasswordFallback(token, userPasswords);
    } catch (error) {
      console.error('Error in bulk password reset:', error);
      // Fallback to individual resets
      return await passwordServices.bulkResetPasswordFallback(token, userPasswords);
    }
  },

  /**
   * Fallback method: Reset passwords one by one
   * @param token - Authentication token
   * @param userPasswords - Map of user IDs to their new passwords
   * @returns Promise<BulkResetPasswordResponse> - Bulk reset result
   */
  bulkResetPasswordFallback: async (
    token: string,
    userPasswords: Map<string, string>
  ): Promise<BulkResetPasswordResponse> => {
    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ user_id: string; error: string }> = [];

    // Reset passwords one by one
    for (const [userId, newPassword] of userPasswords.entries()) {
      try {
        const success = await passwordServices.resetPassword(token, userId, newPassword);
        if (success) {
          successCount++;
        } else {
          failedCount++;
          errors.push({
            user_id: userId,
            error: 'Failed to reset password'
          });
        }
      } catch (error: unknown) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          user_id: userId,
          error: errorMessage
        });
      }
    }

    return {
      success: failedCount === 0,
      totalCount: userPasswords.size,
      successCount,
      failedCount,
      errors
    };
  }
};

