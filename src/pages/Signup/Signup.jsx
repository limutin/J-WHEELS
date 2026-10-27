import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import logo from '../../assets/logo.png';

const signupSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await signup(data.email, data.password, data.displayName);
      showToast('Account created successfully!', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      showToast(
        error.code === 'auth/email-already-in-use'
          ? 'Email already in use'
          : 'Failed to create account. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
        {/* Logo Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25">
          <img src={logo} alt="" className="w-[600px] h-[600px] object-contain" />
        </div>
        
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="w-24 h-24 flex items-center justify-center mb-6">
              <img src={logo} alt="J-Wheels Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-5xl font-heading font-bold mb-4">
              J-Wheels
            </h1>
            <p className="text-xl text-blue-100">
              POS and Inventory System
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img src={logo} alt="J-Wheels Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-slate-900">J-Wheels POS</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">
                Create an account
              </h2>
              <p className="text-slate-600">
                Get started with J-Wheels inventory management
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  error={errors.displayName?.message}
                  {...register('displayName')}
                />
              </div>

              <div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="your.email@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="text-accent hover:text-orange-600 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
