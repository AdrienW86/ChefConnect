import connectToDatabase from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { NextResponse } from "next/server";

export async function POST(request, context) {
  const params = await context.params;
  const { id } = params;

  try {
    await connectToDatabase();

    const body = await request.json();
    console.log("Body reçu :", body);

    const { email, name, price, tva } = body;

    if (!email || !name || price === undefined || tva === undefined) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const priceValue = parseFloat(price);
    const tvaValue = parseFloat(tva);

    if (isNaN(priceValue) || isNaN(tvaValue)) {
      return NextResponse.json({ error: "Price et TVA doivent être des nombres valides" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

    const categoryIndex = user.categories.findIndex(cat => cat._id.toString() === id);
    if (categoryIndex === -1) {
      console.log("Catégories disponibles :", user.categories.map(c => c._id.toString()));
      return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 });
    }

    const product = {
      name: name.trim(),
      price: parseFloat(priceValue.toFixed(2)),
      tva: parseFloat(tvaValue.toFixed(2)),
    };

    console.log("Produit créé :", product);

    user.categories[categoryIndex].products.push(product);
    await user.save();

    return NextResponse.json(user.categories[categoryIndex], { status: 200 });

  } catch (error) {
    console.error("Erreur ajout produit :", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
