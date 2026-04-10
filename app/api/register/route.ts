import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    console.log("📨 RAW body text:", text);

    let body: { email?: string; password?: string; name?: string };
    try {
      body = JSON.parse(text);
    } catch {
      console.log("❌ JSON parse failed");
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    console.log("📦 Parsed body:", body);
    console.log("📧 email:", body.email);
    console.log("🔑 password exists:", !!body.password);

    const { email, password, name } = body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return NextResponse.json({ message: "Заполните почту и пароль" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Email уже используется" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
      },
    });

    console.log("✅ User created:", user.id);
    return NextResponse.json({ message: "Регистрация успешна" }, { status: 201 });

  } catch (error) {
    const err = error as Error;
    console.error("💥 Error:", err.message);
    console.error("💥 Stack:", err.stack);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}