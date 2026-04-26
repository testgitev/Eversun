'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Envelope, Lock, Warning, Buildings, Eye, EyeSlash } from '@phosphor-icons/react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setError(data.error || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md">
        <div className="bg-primary rounded-2xl shadow-md p-8 border border-primary">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-xl mb-4 shadow-sm">
              <Buildings className="w-7 h-7 text-white" weight="bold" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-1">Eversun</h1>
            <p className="text-secondary">Connectez-vous a votre espace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Envelope className="h-4 w-4" weight="bold" />}
              required
            />
            <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" weight="bold" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? (
                <EyeSlash className="h-5 w-5" weight="bold" />
              ) : (
                <Eye className="h-5 w-5" weight="bold" />
              )}
            </button>
          </div>

            {error && (
              <div className="border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <Warning className="w-4 h-4 flex-shrink-0" weight="bold" />
                {error}
              </div>
            )}

            <Button type="submit" loading={isLoading} className="w-full">
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/reset-password')}
              className="text-sm text-secondary hover:text-primary underline underline-offset-4"
            >
              Mot de passe oublie ?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
