// src/app/profile/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { useTheme } from '@/lib/theme/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Phone, 
  Mail, 
  Globe,
  Sun,
  Moon,
  Palette,
  Lock,
  Edit3,
  Save,
  X,
  Calendar,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, colorScheme, toggleTheme, setColorScheme } = useTheme();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phoneNumber: user?.phone_number || '',
    email: user?.email || '',
    preferredLanguage: user?.preferred_language || 'english'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
      toast({
        title: t('profilePage.toasts.updatedTitle', 'Profile Updated'),
        description: t('profilePage.toasts.updatedDesc', 'Your profile information has been successfully updated.'),
        variant: "success",
      });
    }, 1000);
  };

  const handleDeleteAccount = () => {
    // Simulate account deletion
    setTimeout(() => {
      toast({
        title: t('profilePage.toasts.deletedTitle', 'Account Deleted'),
        description: t('profilePage.toasts.deletedDesc', 'Your account has been successfully deleted.'),
        variant: "success",
      });
      logout();
    }, 1000);
  };

  const colorSchemes = [
    { id: 'default', name: 'Indigo', color: 'bg-indigo-600' },
    { id: 'blue', name: 'Ocean', color: 'bg-blue-600' },
    { id: 'green', name: 'Forest', color: 'bg-green-600' },
    { id: 'purple', name: 'Royal', color: 'bg-purple-600' },
    { id: 'orange', name: 'Sunset', color: 'bg-orange-600' },
  ];

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'Hindi (हिंदी)' },
    { value: 'marathi', label: 'Marathi (मराठी)' },
    { value: 'telugu', label: 'Telugu (తెలుగు)' },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{t('profilePage.summary.title', 'Profile Summary')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <div className="bg-muted rounded-full w-24 h-24 flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">{user?.full_name}</h2>
                <p className="text-gray-500 dark:text-gray-400 capitalize mt-1">
                  {user?.role}
                </p>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t('profilePage.summary.joined', 'Joined')} {user?.last_login ? formatDate(user.last_login) : t('profilePage.summary.recently', 'Recently')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information and Settings */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('profilePage.info.title', 'Profile Information')}</CardTitle>
                    <CardDescription>
                      {isEditing 
                        ? t('profilePage.info.editSubtitle', 'Update your personal details') 
                        : t('profilePage.info.viewSubtitle', 'View and manage your profile information')}
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      {t('actions.edit', 'Edit')}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t('profilePage.labels.fullName', 'Full Name')}</Label>
                      {isEditing ? (
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder={t('profilePage.placeholders.fullName', 'Enter your full name')}
                            className="pl-10"
                            required
                          />
                        </div>
                      ) : (
                        <p className="font-medium py-2">{formData.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">{t('profilePage.labels.phoneNumber', 'Phone Number')}</Label>
                      {isEditing ? (
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder={t('profilePage.placeholders.phoneNumber', 'Enter your phone number')}
                            className="pl-10"
                            required
                          />
                        </div>
                      ) : (
                        <div className="flex items-center py-2">
                          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{formData.phoneNumber}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('profilePage.labels.emailAddress', 'Email Address')}</Label>
                      {isEditing ? (
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder={t('profilePage.placeholders.email', 'Enter your email')}
                            className="pl-10"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center py-2">
                          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{formData.email || t('settings.notProvided', 'Not provided')}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredLanguage">{t('profilePage.labels.preferredLanguage', 'Preferred Language')}</Label>
                      {isEditing ? (
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <select
                            id="preferredLanguage"
                            name="preferredLanguage"
                            value={formData.preferredLanguage}
                            onChange={handleInputChange}
                            className="border rounded-md px-3 py-2 w-full pl-10"
                          >
                            {languageOptions.map((lang) => (
                              <option key={lang.value} value={lang.value}>
                                {lang.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center py-2">
                          <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">
                            {languageOptions.find(lang => lang.value === formData.preferredLanguage)?.label || 'English'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                {isEditing && (
                  <CardFooter className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      {t('actions.cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          {t('profilePage.saving', 'Saving...')}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {t('profilePage.saveChanges', 'Save Changes')}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </form>

            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t('profilePage.appearance.title', 'Appearance')}
                </CardTitle>
                <CardDescription>
                  {t('profilePage.appearance.desc', 'Customize the look and feel of your dashboard')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {theme === 'dark' ? (
                      <>
                        <Moon className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{t('profilePage.appearance.darkMode', 'Dark Mode')}</p>
                          <p className="text-sm text-muted-foreground">{t('profilePage.appearance.darkHelp', 'Reduce eye strain in low light')}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Sun className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{t('profilePage.appearance.lightMode', 'Light Mode')}</p>
                          <p className="text-sm text-muted-foreground">{t('profilePage.appearance.lightHelp', 'Bright and vibrant interface')}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={toggleTheme}
                    className="flex items-center gap-2"
                  >
                    {theme === 'dark' ? t('profilePage.appearance.switchToLight', 'Switch to Light') : t('profilePage.appearance.switchToDark', 'Switch to Dark')}
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label className="text-base">{t('profilePage.appearance.colorTheme', 'Color Theme')}</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {colorSchemes.map((scheme) => (
                      <Button
                        key={scheme.id}
                        variant={colorScheme === scheme.id ? 'default' : 'outline'}
                        className="flex items-center justify-start h-auto py-3 px-4"
                        onClick={() => setColorScheme(scheme.id as 'blue' | 'green' | 'purple' | 'orange')}
                      >
                        <div className={`w-4 h-4 rounded-full mr-3 ${scheme.color}`} />
                        <span>{scheme.name}</span>
                        {colorScheme === scheme.id && (
                          <div className="ml-auto h-2 w-2 rounded-full bg-current"></div>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  {t('profilePage.security.title', 'Security')}
                </CardTitle>
                <CardDescription>
                  {t('profilePage.security.desc', 'Manage your account security and authentication')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/change-password')}
                    className="flex items-center gap-2 justify-center"
                  >
                    <Lock className="h-4 w-4" />
                    {t('changePassword.changePassword', 'Change Password')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="flex items-center gap-2 justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('profilePage.security.deleteAccount', 'Delete Account')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Account Deletion */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        title={t('profilePage.confirm.deleteTitle', 'Delete Account')}
        description={t('profilePage.confirm.deleteDesc', 'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.')}
        confirmText={t('profilePage.security.deleteAccount', 'Delete Account')}
        cancelText={t('actions.cancel', 'Cancel')}
        variant="destructive"
        onConfirm={handleDeleteAccount}
      />

      {/* Demo Buttons for Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => toast({ title: t('common.success', 'Success'), description: t('profilePage.demo.success', 'This is a success message'), variant: 'success' })}
        >
          {t('profilePage.demo.showSuccess', 'Show Success Toast')}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => toast({ title: t('common.error', 'Error'), description: t('profilePage.demo.error', 'This is an error message'), variant: 'error' })}
        >
          {t('profilePage.demo.showError', 'Show Error Toast')}
        </Button>
      </div>
    </ProtectedRoute>
  );
}
