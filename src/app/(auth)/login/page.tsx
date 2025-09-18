// src/app/(auth)/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function LoginPage() {
  const [phone_number, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  // Predefined credentials for different user roles
  const userCredentials = {
    teacher: { phone: '1234567894', password: 'password123' },
    admin: { phone: '1234567890', password: 'Shilpa@123' },
    principal: { phone: '1234567891', password: 'password123' }
  };

  const handleUserSelect = (userType: keyof typeof userCredentials) => {
    setPhoneNumber(userCredentials[userType].phone);
    setPassword(userCredentials[userType].password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(phone_number, password);
      router.push('/dashboard'); // Redirect to dashboard after login
    } catch (err) {
      // Error is handled by the auth context
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex justify-end">
          <LanguageSwitcher compact />
        </div>
        <CardTitle className="text-2xl font-bold text-center">{t('brand.name')}</CardTitle>
        <CardDescription className="text-center">{t('auth.title')}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error === 'Login failed' ? t('auth.loginFailed', error) : error}</AlertDescription>
          </Alert>
        )}
        
        {/* User Role Selection */}
        <div className="mb-4">
          <Label htmlFor="user-role">{t('auth.quickLogin')}</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleUserSelect('teacher')}
              className="text-xs"
            >
              {t('common.teacher')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleUserSelect('admin')}
              className="text-xs"
            >
              {t('common.admin')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleUserSelect('principal')}
              className="text-xs"
            >
              {t('common.principal')}
            </Button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone_number">{t('auth.phoneNumber')}</Label>
            <Input
              id="phone_number"
              type="tel"
              placeholder={t('auth.enterPhone')}
              value={phone_number}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('auth.enterPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {t('auth.forgotNote')}
        </div>
      </CardFooter>
    </Card>
  );
}
