'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { createUser } from '@/app/actions/create-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RegisterPage = () => {
  const focus = 'focus:border-1';
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    cpf?: string;
    phone?: string;
    password?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'A senha deve conter pelo menos uma letra';
    }
    if (!/[0-9]/.test(password)) {
      return 'A senha deve conter pelo menos um número';
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return 'A senha deve conter pelo menos um símbolo';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    // Validações
    const newErrors: {
      name?: string;
      email?: string;
      cpf?: string;
      phone?: string;
      password?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }

    if (!email.trim()) {
      newErrors.email = 'O email é obrigatório';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Digite um email válido';
    }

    const cpfDigits = cpf.replace(/\D/g, '');
    if (!cpfDigits) {
      newErrors.cpf = 'O CPF é obrigatório';
    } else if (cpfDigits.length !== 11) {
      newErrors.cpf = 'Digite um CPF válido';
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.phone = 'O telefone é obrigatório';
    } else if (phoneDigits.length < 10) {
      newErrors.phone = 'Digite um telefone válido';
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await createUser({
        name: name.trim(),
        email: email.trim(),
        cpf: cpfDigits,
        phone: phoneDigits,
        password,
      });

      if (result.success && result.userId) {
        toast.success('Usuário criado com sucesso!');
        router.push(`/create-restaurant?userId=${result.userId}`);
      } else {
        toast.error(result.error || 'Erro ao criar usuário');
      }
    } catch {
      toast.error('Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-3xl">Registrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Digite seu nome"
                className={`w-full ${focus} ${errors.name ? 'border-destructive' : ''}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                className={`w-full ${focus} ${errors.email ? 'border-destructive' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="Digite seu CPF"
                className={`w-full ${focus} ${errors.cpf ? 'border-destructive' : ''}`}
                value={cpf}
                onChange={(e) => {
                  setCpf(e.target.value);
                  if (errors.cpf) {
                    setErrors((prev) => ({ ...prev, cpf: undefined }));
                  }
                }}
                disabled={isLoading}
              />
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="text"
                placeholder="Digite seu telefone"
                className={`w-full ${focus} ${errors.phone ? 'border-destructive' : ''}`}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) {
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                }}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  className={`w-full pr-10 ${focus} ${errors.password ? 'border-destructive' : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              {!errors.password && password && (
                <p className="text-xs text-muted-foreground">
                  A senha deve ter no mínimo 8 caracteres, incluindo letras,
                  números e símbolos
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Registrar'}
            </Button>
            <div className="text-center text-sm">
              <Link href="/" className="text-primary hover:underline">
                Já tem uma conta? Faça login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
