import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as { id: string; name: string; email: string; role: string };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("인증이 필요합니다.");
  }
  return user;
}
