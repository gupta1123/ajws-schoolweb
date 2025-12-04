// src/lib/api/passwords.ts

import { apiClient } from './client';

export interface ResetPasswordRequest {
  user_id: string;
  new_password: string;
}

export interface BulkResetPasswordRequest {
  user_ids: string[];
  new_password: string;
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
      // Note: This endpoint may need to be created on the backend
      // For now, we'll use a generic admin password reset endpoint
      const response = await apiClient.post(
        '/api/auth/admin/reset-password',
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
      // Fallback: try alternative endpoint structure
      try {
        const response = await apiClient.put(
          `/api/users/${userId}/password`,
          { new_password: newPassword },
          token
        );

        if (response instanceof Blob) {
          return false;
        }

        if ('status' in response) {
          return response.status === 'success';
        }

        return false;
      } catch (fallbackError) {
        console.error('Fallback password reset also failed:', fallbackError);
        return false;
      }
    }
  },

  /**
   * Reset passwords for multiple users in bulk
   * @param token - Authentication token
   * @param userIds - Array of user IDs to reset passwords for
   * @param newPassword - New password for all users
   * @returns Promise<BulkResetPasswordResponse> - Bulk reset result
   */
  bulkResetPassword: async (
    token: string,
    userIds: string[],
    newPassword: string
  ): Promise<BulkResetPasswordResponse> => {
    try {
      // Try bulk endpoint first
      const response = await apiClient.post(
        '/api/auth/admin/bulk-reset-password',
        {
          user_ids: userIds,
          new_password: newPassword
        },
        token
      );

      if (response instanceof Blob) {
        // If bulk endpoint doesn't exist, fall back to individual resets
        return await passwordServices.bulkResetPasswordFallback(token, userIds, newPassword);
      }

      if ('status' in response && response.status === 'success' && 'data' in response) {
        const data = response.data as {
          success_count?: number;
          failed_count?: number;
          errors?: Array<{ user_id: string; error: string }>;
        };
        return {
          success: true,
          totalCount: userIds.length,
          successCount: data.success_count ?? userIds.length,
          failedCount: data.failed_count ?? 0,
          errors: data.errors ?? []
        };
      }

      // Fallback to individual resets
      return await passwordServices.bulkResetPasswordFallback(token, userIds, newPassword);
    } catch (error) {
      console.error('Error in bulk password reset:', error);
      // Fallback to individual resets
      return await passwordServices.bulkResetPasswordFallback(token, userIds, newPassword);
    }
  },

  /**
   * Fallback method: Reset passwords one by one
   * @param token - Authentication token
   * @param userIds - Array of user IDs to reset passwords for
   * @param newPassword - New password for all users
   * @returns Promise<BulkResetPasswordResponse> - Bulk reset result
   */
  bulkResetPasswordFallback: async (
    token: string,
    userIds: string[],
    newPassword: string
  ): Promise<BulkResetPasswordResponse> => {
    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ user_id: string; error: string }> = [];

    // Reset passwords one by one
    for (const userId of userIds) {
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
      totalCount: userIds.length,
      successCount,
      failedCount,
      errors
    };
  }
};

