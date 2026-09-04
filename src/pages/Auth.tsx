import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Mail, Lock, User, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getDefaultRoute, resolvePostLoginRedirect, CHAT_PATH } from '@/lib/auth-utils';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const SIGNUP_PENDING_KEY = 'flymasters.signup.pending';

type PendingSignup = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

function readPendingSignup(): PendingSignup | null {
  try {
    const raw = sessionStorage.getItem(SIGNUP_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePendingSignup(value: PendingSignup | null) {
  try {
    if (!value) sessionStorage.removeItem(SIGNUP_PENDING_KEY);
    else sessionStorage.setItem(SIGNUP_PENDING_KEY, JSON.stringify(value));
  } catch {
    // Private browsing can block storage.
  }
}

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = resolvePostLoginRedirect(
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname,
    new URLSearchParams(location.search).get('redirect')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [registrationSettings, setRegistrationSettings] = useState<{enabled: boolean, message?: string, admin_contact?: any} | null>(null);
  const [signupStep, setSignupStep] = useState<'details' | 'verify'>(() =>
    readPendingSignup() ? 'verify' : 'details'
  );
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingSignup, setPendingSignup] = useState<PendingSignup>(() =>
    readPendingSignup() || { email: '', password: '', firstName: '', lastName: '' }
  );
  const { signIn, signUp, sendSignupVerificationCode, resetPassword, updatePassword, user, userRole, roleLoading } = useAuth();

  // Check if this is a password recovery or email confirmation callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    } else if (type === 'signup') {
      // Email confirmation successful
      setSuccess('Email confirmed successfully! You can now sign in with your credentials.');
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Handle authentication errors from email links
    if (error) {
      setError(errorDescription || 'An error occurred during authentication. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Fetch registration settings
    const fetchRegistrationSettings = async () => {
      const { data }: any = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'registration_enabled')
        .maybeSingle();
      
      if (data?.value) {
        setRegistrationSettings(data.value);
      }
    };
    
    fetchRegistrationSettings();

    const savedSignup = readPendingSignup();
    if (savedSignup) {
      setPendingSignup(savedSignup);
      setSignupStep('verify');
      setSuccess(`Enter the verification code sent to ${savedSignup.email}.`);
    }
  }, []);

  // Redirect if already authenticated (but not in recovery mode)
  useEffect(() => {
    if (user && !isRecoveryMode && !roleLoading && userRole) {
      const destination = redirectTo || getDefaultRoute(userRole);
      navigate(destination, { replace: true });
    }
  }, [user, isRecoveryMode, roleLoading, userRole, navigate, redirectTo]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
    // Note: If successful, signIn will redirect automatically
  };

  const handleSendSignupCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (registrationSettings && !registrationSettings.enabled) {
      setError(registrationSettings.message || 'New user registration is temporarily on hold.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = formData.get('password') as string;
    const firstName = String(formData.get('firstName') || '').trim();
    const lastName = String(formData.get('lastName') || '').trim();

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const { error, data } = await sendSignupVerificationCode(email);
    const signupDetails = { email, password, firstName, lastName };

    if (error) {
      if (data?.pendingVerification) {
        setPendingSignup(signupDetails);
        writePendingSignup(signupDetails);
        setVerificationCode('');
        setSignupStep('verify');
        setSuccess(error.message);
        setError(null);
      } else {
        setError(error.message);
      }
      setIsLoading(false);
      return;
    }

    setPendingSignup(signupDetails);
    writePendingSignup(signupDetails);
    setVerificationCode('');
    setSignupStep('verify');
    setSuccess(`Verification code sent to ${email}. Check your inbox (and spam folder).`);
    setIsLoading(false);
  };

  const handleVerifyAndSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (verificationCode.length !== 6) {
      setError('Enter the 6-digit verification code from your email.');
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(
      pendingSignup.email,
      pendingSignup.password,
      pendingSignup.firstName,
      pendingSignup.lastName,
      verificationCode
    );

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Email verified. Your account is ready — you are signed in.');
      setSignupStep('details');
      setVerificationCode('');
      writePendingSignup(null);
    }
    setIsLoading(false);
  };

  const handleResendSignupCode = async () => {
    if (!pendingSignup.email) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const { error, data } = await sendSignupVerificationCode(pendingSignup.email);
    if (error) {
      if (data?.pendingVerification) {
        setSuccess(error.message);
        setError(null);
      } else {
        setError(error.message);
      }
    } else {
      setSuccess(`A new verification code was sent to ${pendingSignup.email}.`);
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    const { error } = await resetPassword(email);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password reset email sent! Please check your inbox.');
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const { error } = await updatePassword(newPassword);
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSuccess('Password updated successfully! Redirecting...');
      // Wait a moment then let the useEffect handle the redirect based on role
      setIsLoading(false);
      setIsRecoveryMode(false);
    }
  };

  // If in recovery mode, show password update form
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-primary opacity-20 float-animation" />
        <div className="absolute bottom-32 right-16 w-16 h-16 rounded-full bg-accent-cyan opacity-30 float-animation" style={{animationDelay: '2s'}} />
        
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl">Fly AI Pathfinder</h1>
                <p className="text-sm text-muted-foreground">University Selection</p>
              </div>
            </div>
          </div>

          <Card className="glass-card border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Set New Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      className="pl-10"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="pl-10"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="hero"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
      {/* Background Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-primary opacity-20 float-animation" />
      <div className="absolute bottom-32 right-16 w-16 h-16 rounded-full bg-accent-cyan opacity-30 float-animation" style={{animationDelay: '2s'}} />
      
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Fly AI Pathfinder</h1>
              <p className="text-sm text-muted-foreground">University Selection</p>
            </div>
          </div>
        </div>

        <Card className="glass-card border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {redirectTo === CHAT_PATH ? 'Sign in to use AI Chat' : 'Welcome'}
            </CardTitle>
            <CardDescription>
              {redirectTo === CHAT_PATH
                ? 'Please sign in or create an account to start chatting with our AI advisor'
                : 'Sign in to your account or create a new one to get started'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="reset">Reset</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email or student login</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="text"
                        autoComplete="username"
                        placeholder="you@email.com or sairam07111"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                {registrationSettings && !registrationSettings.enabled && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>{registrationSettings.message}</p>
                        {registrationSettings.admin_contact && (
                          <div className="text-sm mt-2">
                            <p className="font-semibold">Contact Admin:</p>
                            <p>📞 Phone: {registrationSettings.admin_contact.phone}</p>
                            <p>💬 WhatsApp: {registrationSettings.admin_contact.whatsapp}</p>
                            <p>✉️ Email: {registrationSettings.admin_contact.email}</p>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {signupStep === 'details' ? (
                <form onSubmit={handleSendSignupCode} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          placeholder="John"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                  </Button>
                </form>
                ) : (
                <form onSubmit={handleVerifyAndSignUp} className="space-y-4">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
                    <ShieldCheck className="w-8 h-8 mx-auto text-primary" />
                    <p className="text-sm font-medium">Verify your email</p>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code sent to <span className="font-medium text-foreground">{pendingSignup.email}</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        id="verification-code"
                        maxLength={6}
                        value={verificationCode}
                        onChange={setVerificationCode}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="hero"
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                      onClick={() => {
                        setSignupStep('details');
                        setError(null);
                        setSuccess(null);
                        setVerificationCode('');
                        writePendingSignup(null);
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                      onClick={handleResendSignupCode}
                    >
                      Resend Code
                    </Button>
                  </div>
                </form>
                )}
              </TabsContent>

              <TabsContent value="reset" className="space-y-4">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We'll send you a password reset link to your email.
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;