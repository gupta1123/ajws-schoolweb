// src/app/change-password/page.tsx

'use client';

import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('changePassword.errors.mismatch'));
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError(t('changePassword.errors.tooShort'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Show success message
      alert(t('changePassword.success'));
      router.push('/profile');
    }, 1000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-md mx-auto pt-16">
          {/* Action Bar */}
          <div className="flex justify-end mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
            >
              ← {t('changePassword.backToProfile')}
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-gray-500" />
                  </div>
                </div>
                <CardTitle>{t('changePassword.title')}</CardTitle>
                <CardDescription>
                  {t('changePassword.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('changePassword.current')}</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder={t('changePassword.enterCurrent')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('changePassword.new')}</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder={t('changePassword.enterNew')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('changePassword.confirm')}</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder={t('changePassword.confirmNew')}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  {t('actions.cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t('changePassword.changing') : t('changePassword.changePassword')}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
