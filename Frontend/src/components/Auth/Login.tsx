import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography, InputAdornment, IconButton, FormControlLabel, Checkbox } from '@mui/material';
import { useAuth } from '../../services/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validate = () => {
    if (!email || !email.includes('@')) return 'Please enter a valid email.';
    if (!password || password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      if (remember) {
        localStorage.setItem('remember_email', email);
      } else {
        localStorage.removeItem('remember_email');
      }
      const dest = location.state?.from?.pathname || '/dashboard';
      navigate(dest, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Validation failed: Login failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('remember_email');
    if (saved) setEmail(saved);
  }, []);

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2, background: 'linear-gradient(135deg, #f3f6ff 0%, #ffffff 100%)' }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 480 }} role="main" aria-labelledby="login-title">
        <Typography id="login-title" variant="h5" mb={2}>Sign in to Stock Management</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>Securely manage products, sales and inventory.</Typography>

        <Stack component="form" onSubmit={handleSubmit} spacing={2} noValidate>
          <TextField
            inputRef={emailRef}
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required
            aria-label="Email"
            InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon /></InputAdornment>) }}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required
            aria-label="Password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((s) => !s)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />} label="Remember email" />
            <Button size="small" onClick={() => alert('Password reset not configured in this demo')}>Forgot?</Button>
          </Stack>

          {error && <Typography color="error" role="alert">{error}</Typography>}

          <Button type="submit" variant="contained" disabled={loading} aria-label="Login">
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Login;
