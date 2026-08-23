import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { findUserByEmail } from "@/lib/queries/users";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user || !user.active) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  await setSessionCookie({ sub: user.id, role: user.role, name: user.name, email: user.email });
  return NextResponse.json({ ok: true });
}
