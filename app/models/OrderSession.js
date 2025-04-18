import mongoose from "mongoose";

const OrderSessionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  profit: { type: Number, default: 0 },
  payment: {
    especes: { type: Number, default: 0 },
    cb: { type: Number, default: 0 },
    check: { type: Number, default: 0 },
    ticket: { type: Number, default: 0 },
  },
  tables: [
    {
      number: { type: Number, required: true },
      items: [
        {
          name: { type: String, required: true },
          price: { type: Number, required: true },
          tva: { type: Number, required: true },
        },
      ],
    },
  ],
});

export default mongoose.models.OrderSession || mongoose.model("OrderSession", OrderSessionSchema);

