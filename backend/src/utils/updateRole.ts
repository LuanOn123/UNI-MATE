import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

async function run() {
  await connectDB();
  const res = await User.updateOne({ email: "partner@test.com" }, { role: "partner" });
  console.log("Updated:", res.modifiedCount);
  process.exit(0);
}
run();
