/**
 * Profile Page
 * User profile management, settings, and account information
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff, 
  Lock, 
  Camera,
  Settings,
  Package,
  DollarSign,
  TrendingUp,
  Star,
  Award,
  CheckCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { RequireAuth } from '@/components/auth/ProtectedRoute';
import { api, queryKeys } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User as UserType } from '@/types';

// Form schemas
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  full_name: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

const notificationSchema = z.object({
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  marketing_emails: z.boolean(),
  product_updates: z.boolean(),
  price_alerts: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Fetch user's products for stats
  const { data: productsResponse } = useQuery({
    queryKey: queryKeys.products({ seller_id: user?.id }),
    queryFn: () => api.getProducts({ seller_id: user?.id, per_page: 100 }),
    enabled: !!user?.id,
  });

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      full_name: user?.full_name || '',
      bio: user?.bio || '',
      location: user?.location || '',
      phone: user?.phone || '',
      website: user?.website || '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications: user?.email_notifications ?? true,
      push_notifications: user?.push_notifications ?? true,
      marketing_emails: user?.marketing_emails ?? false,
      product_updates: user?.product_updates ?? true,
      price_alerts: user?.price_alerts ?? true,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => api.updateProfile(data),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) => api.changePassword(data),
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password.",
        variant: "destructive",
      });
    },
  });

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: (data: NotificationFormData) => api.updateNotifications(data),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notifications. Please try again.",
        variant: "destructive",
      });
    },
  });

  const products = productsResponse?.products || [];
  
  const getStats = () => {
    const sold = products.filter(p => p.status === 'sold').length;
    const available = products.filter(p => p.status === 'available').length;
    const totalValue = products
      .filter(p => p.status === 'available')
      .reduce((sum, p) => sum + p.price, 0);
    
    return {
      totalProducts: products.length,
      sold,
      available,
      totalValue,
      joinDate: user?.created_at ? new Date(user.created_at) : new Date(),
    };
  };

  const stats = getStats();

  const onSubmitProfile = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  const onSubmitNotifications = (data: NotificationFormData) => {
    updateNotificationsMutation.mutate(data);
  };

  const handleCancelEdit = () => {
    profileForm.reset();
    setIsEditing(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Profile & Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-2xl">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold">{user.full_name || user.username}</h2>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {formatDate(stats.joinDate)}</span>
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-sm text-center text-muted-foreground">
                        {user.bio}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified Student
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-primary">{stats.totalProducts}</p>
                      <p className="text-xs text-muted-foreground">Products Listed</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-green-600">{stats.sold}</p>
                      <p className="text-xs text-muted-foreground">Items Sold</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available Items:</span>
                      <span className="font-medium">{stats.available}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Value:</span>
                      <span className="font-medium text-primary">{formatPrice(stats.totalValue)}</span>
                    </div>
                  </div>

                  {/* Placeholder for achievements */}
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      Achievements
                    </h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        First Sale
                      </Badge>
                      {stats.sold >= 5 && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Top Seller
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Profile Information</CardTitle>
                        {!isEditing ? (
                          <Button variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button 
                              onClick={profileForm.handleSubmit(onSubmitProfile)}
                              disabled={updateProfileMutation.isPending}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Form {...profileForm}>
                        <form className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      disabled={!isEditing}
                                      placeholder="Enter your username"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="full_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      disabled={!isEditing}
                                      placeholder="Enter your full name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    disabled={!isEditing}
                                    type="email"
                                    placeholder="Enter your email"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    disabled={!isEditing}
                                    placeholder="Tell us about yourself..."
                                    className="min-h-[100px]"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Brief description for your profile. Maximum 500 characters.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="location"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      disabled={!isEditing}
                                      placeholder="City, State"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      disabled={!isEditing}
                                      placeholder="(555) 123-4567"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    disabled={!isEditing}
                                    placeholder="https://yourwebsite.com"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Change Password */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Change Password</h3>
                        <Form {...passwordForm}>
                          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                            <FormField
                              control={passwordForm.control}
                              name="current_password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Password</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        {...field}
                                        type={showCurrentPassword ? "text" : "password"}
                                        placeholder="Enter current password"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                      >
                                        {showCurrentPassword ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={passwordForm.control}
                              name="new_password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        {...field}
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                      >
                                        {showNewPassword ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={passwordForm.control}
                              name="confirm_password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm New Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="password"
                                      placeholder="Confirm new password"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button 
                              type="submit" 
                              disabled={changePasswordMutation.isPending}
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              Change Password
                            </Button>
                          </form>
                        </Form>
                      </div>

                      <Separator />

                      {/* Two-Factor Authentication */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            Two-factor authentication is not enabled. Enable it to add an extra layer of security to your account.
                          </AlertDescription>
                        </Alert>
                        <Button variant="outline" className="mt-4">
                          Enable 2FA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      <Form {...notificationForm}>
                        <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                          <div className="space-y-4">
                            <FormField
                              control={notificationForm.control}
                              name="email_notifications"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Email Notifications</FormLabel>
                                    <FormDescription>
                                      Receive important updates via email
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={notificationForm.control}
                              name="push_notifications"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Push Notifications</FormLabel>
                                    <FormDescription>
                                      Receive instant notifications in your browser
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={notificationForm.control}
                              name="product_updates"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Product Updates</FormLabel>
                                    <FormDescription>
                                      Get notified about your product listings
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={notificationForm.control}
                              name="price_alerts"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Price Alerts</FormLabel>
                                    <FormDescription>
                                      Get notified about price changes and deals
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={notificationForm.control}
                              name="marketing_emails"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Marketing Emails</FormLabel>
                                    <FormDescription>
                                      Receive promotional content and feature updates
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button 
                            type="submit" 
                            disabled={updateNotificationsMutation.isPending}
                          >
                            <Bell className="h-4 w-4 mr-2" />
                            Save Preferences
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy">
                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy Settings</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Profile Visibility</h3>
                            <p className="text-sm text-muted-foreground">
                              Control who can see your profile information
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Show Online Status</h3>
                            <p className="text-sm text-muted-foreground">
                              Let others see when you're active on the platform
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Allow Direct Messages</h3>
                            <p className="text-sm text-muted-foreground">
                              Let other users send you direct messages
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-medium mb-4 text-destructive">Danger Zone</h3>
                        <div className="border border-destructive rounded-lg p-4">
                          <h4 className="font-medium mb-2">Delete Account</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                          <Button variant="destructive" size="sm">
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </RequireAuth>
  );
};

export default Profile;