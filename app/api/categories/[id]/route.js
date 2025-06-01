import { connectToDatabase } from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params; // id de la catégorie à modifier

  try {
     await connectToDatabase();

    const body = await request.json();
    const { name, email } = body; // on récupère le nouveau nom + email utilisateur

    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

    // Trouver la catégorie dans le tableau categories
    const categoryIndex = user.categories.findIndex(cat => cat._id.toString() === id);
    if (categoryIndex === -1)
      return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 });

    // Modifier le nom
    user.categories[categoryIndex].name = name;
    await user.save();

    return NextResponse.json(user.categories[categoryIndex], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await connectToDatabase();

    let email = null;

    try {
      const body = await request.json();
      email = body.email;
    } catch (err) {
      return NextResponse.json({ error: "Corps JSON manquant ou invalide" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $pull: { categories: { _id: id } } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ message: "Catégorie supprimée", user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}



