import { connectToDatabase } from "@/app/lib/mongodb";
import User from "@/app/models/User";
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    await connectToDatabase();

    const { userId, name, email, password } = await request.json();

    if (!userId || !name || !email) {
      return new Response(
        JSON.stringify({ success: false, message: "Champs obligatoires manquants." }),
        { status: 400 }
      );
    }

    const updateData = { username: name, email };

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Utilisateur non trouvé." }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, user }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, message: "Erreur serveur." }),
      { status: 500 }
    );
  }
}
