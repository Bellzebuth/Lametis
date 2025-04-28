import { sign, verify } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";

const secret = "supersecret"; // modify for env variable

export const signToken = async (payload: JWTPayload) => {
  return await sign(payload, secret);
};

export const verifyToken = async (token: string) => {
  return await verify(token, secret);
};
