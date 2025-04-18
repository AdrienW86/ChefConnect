import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";  // Utilisation du chemin relatif


export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ message: "Connexion réussie à MongoDB ! 🎉" });
  } catch (error) {
    return NextResponse.json({ message: "Erreur de connexion à MongoDB", error }, { status: 500 });
  }
}
