import { cookies } from "next/headers";

export async function POST() {
  cookies().delete("token"); // Supprime le token de l'utilisateur
  return Response.json({ message: "Déconnexion réussie" }, { status: 200 });
}
