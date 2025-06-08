import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const DailyReportSchema = new mongoose.Schema({
  day: { type: Number, required: true },
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

const MonthSchema = new mongoose.Schema({
  month: { type: String, required: true }, // Ex: "06"
  days: { type: [DailyReportSchema], default: [] },
});

const YearlyReportSchema = new mongoose.Schema({
  year: { type: String, required: true }, // Ex: "2025"
  months: { type: [MonthSchema], default: [] },
});


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

  reports: { type: [YearlyReportSchema], default: [] }, 

  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.models.User || mongoose.model("User", UserSchema);