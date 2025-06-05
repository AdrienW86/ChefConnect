import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// --- Schéma du rapport journalier ---
const DailyReportSchema = new mongoose.Schema({
  day: { type: Number, required: true }, // Ex: 5
  totalRevenue: { type: Number, required: true },
  tva: {
    tva5_5: { type: Number, default: 0 },
    tva10: { type: Number, default: 0 },
    tva20: { type: Number, default: 0 },
  },
  payments: {
    cash: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
    check: { type: Number, default: 0 },
    ticket: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

// Remplace cette partie dans ton UserSchema :

const YearlyReportSchema = new mongoose.Schema({
  year: { type: String, required: true },
  months: {
    type: Map,
    of: [DailyReportSchema],
    default: {}
  },
});



// --- Schéma de catégorie ---
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  products: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      tva: { type: Number, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// --- Schéma principal utilisateur ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  comptabilityEmail: { type: String, default: "" },
  recipe: { type: Array, default: [] },
  menu: { type: Array, default: [] },
  categories: { type: [CategorySchema], default: [] },

  orders: {
    type: [
      {
        tableNumber: { type: Number, required: true },
        items: [
          {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            tva: { type: Number, required: true },
          },
        ],
        total: { type: Number, required: true },
        paymentMethod: {
          type: String,
          enum: ["espèces", "carte", "chèque", "ticket"],
          required: true,
        },
        status: {
          type: String,
          enum: ["en cours", "payée"],
          default: "en cours",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },

  reports: { type: [YearlyReportSchema], default: [] }, // <<< AJOUT STRUCTURE REPORTS

  createdAt: { type: Date, default: Date.now },
});

// --- Middleware pour hash du mot de passe ---
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Export ---
export default mongoose.models.User || mongoose.model("User", UserSchema);
