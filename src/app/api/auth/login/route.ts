import { NextResponse } from 'next/server';
import { query } from '@/lib/dbUtils';
import { LoginCredentials, AuthResponse } from '@/types/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // Get user from database
    const users = await query('SELECT * FROM users WHERE email = ?', [email]) as User[];
    const user = users[0];

    if (!user) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from user object
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json<AuthResponse>({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<AuthResponse>({
      success: false,
      message: 'An error occurred during login'
    }, { status: 500 });
  }
} 