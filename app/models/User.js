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
  date: { type: Date, default: Date.now },
  tables: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

// Schéma de la catégorie intégrée
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  products: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true, get: v => v.toFixed(2), set: v => parseFloat(v.toFixed(2)) },
      tva: { type: Number, required: true, get: v => v.toFixed(2), set: v => parseFloat(v.toFixed(2)) }, // ajout de TVA
    }
  ],
  createdAt: { type: Date, default: Date.now },
});


// Schéma de l'utilisateur
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  comptabilityEmail: { type: String, default: "" },
  session: { type: SessionSchema, default: {} },
  recipe: { type: Array, default: [] },
  menu: { type: Array, default: [] },
  categories: { type: [CategorySchema], default: [] }, // ✅ ici !
  createdAt: { type: Date, default: Date.now },
});

// Hashage du mot de passe avant sauvegarde
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Export du modèle
export default mongoose.models.User || mongoose.model("User", UserSchema);
