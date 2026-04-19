import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(process.env.APPS_SCRIPT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.APPS_SCRIPT_SECRET,
      to: 'твой@gmail.com',
      subject: 'Test email',
      html: '<h1>Работает!</h1>'
    })
  });

  const data = await res.json();
  return NextResponse.json(data);
}