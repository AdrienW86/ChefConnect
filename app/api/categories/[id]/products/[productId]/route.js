import connectToDatabase from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  // Await les params avant de les utiliser
  const resolvedParams = await params;
  const { id: categoryId, productId } = resolvedParams;

  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, name, price, tva } = body;

    if (!email || !name || price === undefined || tva === undefined) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const priceNum = Number(price);
    const tvaNum = Number(tva);

    if (isNaN(priceNum) || isNaN(tvaNum)) {
      return NextResponse.json({ error: "Prix ou TVA invalides" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const category = user.categories.find(cat => cat._id.toString() === categoryId);
    if (!category) {
      return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 });
    }

    const product = category.products.id(productId);
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    product.name = name.trim();
    product.price = parseFloat(priceNum.toFixed(2));
    product.tva = parseFloat(tvaNum.toFixed(2));

    await user.save();

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Erreur modification produit :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export async function DELETE(req, context) {
  const params = await context.params;
  const { id: categoryId, productId } = params;

  try {
    await connectToDatabase();

    const body = await req.json();
    const { email } = body;
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    console.log("Email reçu :", email);
    console.log("CategoryId reçu :", categoryId);

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

    console.log("Catégories utilisateur :", user.categories.map(c => c._id.toString()));

    const category = user.categories.find(cat => cat._id.toString() === categoryId);
    if (!category) return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 });

    const productIndex = category.products.findIndex(p => p._id.toString() === productId);
    if (productIndex === -1) return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });

    category.products.splice(productIndex, 1);
    await user.save();

    return NextResponse.json({ message: "Produit supprimé" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
