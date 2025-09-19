'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    console.log('Submitting form:', { email: formData.email, isLogin });
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include', // <<< THIS IS CRUCIAL
    });

    const data = await response.json();
    console.log('Response:', response);

    if (response.ok) {
      console.log('Login/Register successful, redirecting to:', `/dashboard/${data.user.role}`);
      router.push(`/dashboard/${data.user.role}`);
      router.refresh(); // Force refresh to trigger middleware
    } else {
      setError(data.error || 'Authentication failed');
      console.error('Authentication failed:', data);
    }
  } catch (error) {
    console.error('Network error:', error);
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Truck className="w-8 h-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold">RideManager</span>
          </div>
          <CardTitle>{isLogin ? 'Sign In' : 'Sign Up'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Welcome back' : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Signing Up...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
          
          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Demo Credentials:</h4>
            <div className="text-xs space-y-1">
              <div><strong>Admin:</strong> admin@gmail.com / admin12345</div>
              <div><strong>PM:</strong> pm@gmail.com / pm12345</div>
              <div><strong>Driver:</strong> driver@gmail.com / driver12345</div>
              <div><strong>User:</strong> user@gmail.com / user12345</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}