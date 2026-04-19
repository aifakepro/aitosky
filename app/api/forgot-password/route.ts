import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Enter your email' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Не говорим существует ли юзер — защита от перебора
    if (!user || !user.password) {
      return NextResponse.json({ message: 'If this email exists, you will receive a reset link' }, { status: 200 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 час

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires }
    });

    const resetUrl = `https://aitosky.vercel.app/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: 'Reset your password — AiToSky',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          ">Reset password</a>
          <p style="color: #888; font-size: 13px;">
            Link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
        </div>
      `
    });

    return NextResponse.json({ message: 'If this email exists, you will receive a reset link' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}