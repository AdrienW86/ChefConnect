import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Schéma de la session unique
const SessionSchema = new mongoose.Schema({
  recipe: {
    money: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
    check: { type: Number, default: 0 },
    ticket: { type: Number, default: 0 },
  },
  date: { type: Date, default: Date.now }, // Date au bon format
  tables: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }, // Date de création
  updatedAt: { type: Date, default: Date.now }, // Date de mise à jour
  isActive: { type: Boolean, default: true }, // Statut de la session
});

// Schéma de l'utilisateur
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  comptabilityEmail: { type: String, default: "" },
  session: { type: SessionSchema, default: {} }, // Une seule session par utilisateur
  recipe: { type: Array, default: [] },
  menu: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
});

// Hashage du mot de passe avant de sauvegarder l'utilisateur
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Créer un modèle User à partir du schéma
export default mongoose.models.User || mongoose.model("User", UserSchema);
