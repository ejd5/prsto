import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "prsto-dev-secret-change-in-production";
const SALT_ROUNDS = 12;

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function createUser(email: string, password: string, name?: string) {
  const passwordHash = await hashPassword(password);
  const { prisma } = await import("@/lib/prisma");
  return prisma.user.create({
    data: { email, password: passwordHash, name: name || email.split("@")[0] },
  });
}

export function getJwtSecret(): string {
  return JWT_SECRET;
}
