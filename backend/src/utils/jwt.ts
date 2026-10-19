
import jwt, {
  type Secret,
  type SignOptions,
} from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is missing from the backend .env file'
  );
}

export function signToken(
  userId: number,
  role: string
): string {
  const options: SignOptions = {
    expiresIn: '1d',
  };

  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    options
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
