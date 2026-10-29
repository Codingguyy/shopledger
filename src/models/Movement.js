import mongoose from "mongoose";

export const MOVEMENT_TYPES = ["purchase", "sale", "return", "adjustment"];
const MovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    type: { type: String, enum: MOVEMENT_TYPES, required: true },
    quantity: { type: Number, required: true }, 
    delta: { type: Number, required: true }, 
    reason: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
  },
  { timestamps: true }
);
MovementSchema.index({ product: 1, date: -1 });

export default mongoose.models.Movement || mongoose.model("Movement", MovementSchema);
