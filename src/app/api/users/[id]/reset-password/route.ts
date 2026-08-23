import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { findUserById, setPasswordHash } from "@/lib/queries/users";
import { randomPassword } from "@/lib/utils";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const target = await findUserById(params.id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tempPassword = randomPassword();
  const hash = await hashPassword(tempPassword);
  await setPasswordHash(target.id, hash, true);

  return NextResponse.json({ tempPassword });
}
