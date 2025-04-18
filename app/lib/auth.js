// lib/auth.js
import jwt from "jsonwebtoken";

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);  // Vérifie le token avec la clé secrète
  } catch (error) {
    return null;  // Si le token est invalide ou expiré, retourne null
  }
}
