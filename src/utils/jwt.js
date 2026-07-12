import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN;

export function signToken(userId) {
  return jwt.sign({ userId }, secret, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, secret);
}
