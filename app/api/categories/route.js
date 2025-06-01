import { NextResponse } from "next/server";
import User from "@/app/models/User";
import { connectToDatabase } from "@/app/lib/mongodb";

export async function POST(req) {
  await connectToDatabase();

  const { name, email } = await req.json();
  console.log("Email reçu:", email);

  if (!name) {
    return NextResponse.json({ message: "Nom de catégorie requis" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ message: "Email utilisateur requis" }, { status: 400 });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
  }

  if (!user.categories) {
    user.categories = [];
  }

  const newCategory = { name, products: [] };
  user.categories.push(newCategory);
  await user.save();

  return NextResponse.json({ message: "Catégorie ajoutée", category: newCategory }, { status: 200 });
}

export async function GET(req) {
  await connectToDatabase();

  const email = req.nextUrl.searchParams.get("email"); // ou récupère l'email autrement (token, session, etc.)
  if (!email) {
    return NextResponse.json({ message: "Email requis" }, { status: 400 });
  }

  const user = await User.findOne({ email }, { categories: 1 }); // ne récupère que les catégories
  if (!user) {
    return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
  }

  return NextResponse.json({ categories: user.categories }, { status: 200 });
}

