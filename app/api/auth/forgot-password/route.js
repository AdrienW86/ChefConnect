import { connectToDatabase } from "../../../lib/mongodb";
import User from "../../../models/User";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";  // Import de NextResponse

export async function POST(req) {
  const { email } = await req.json();

  try {
    await connectToDatabase();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "Aucun compte trouvé avec cet email" }, { status: 404 });
    }

    // Générer un token JWT valable 1h
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Lien de réinitialisation
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    // Envoi de l'email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>Ce lien expire dans 1 heure.</p>`,
    });

    return NextResponse.json({ message: "Un email de réinitialisation a été envoyé !" });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ message: "Erreur interne" }, { status: 500 });
  }
}