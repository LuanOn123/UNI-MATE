import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

function convertExtendedJson(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(convertExtendedJson);
  if ("$oid" in obj && typeof obj.$oid === "string") {
    return new mongoose.Types.ObjectId(obj.$oid);
  }
  if ("$date" in obj && typeof obj.$date === "string") {
    return new Date(obj.$date);
  }
  const res: any = {};
  for (const [k, v] of Object.entries(obj)) {
    res[k] = convertExtendedJson(v);
  }
  return res;
}

async function main() {
  const defaultFilePath = "C:/Users/nguye/Downloads/uni.users.json";
  const targetPath = process.argv[2] || defaultFilePath;

  if (!fs.existsSync(targetPath)) {
    console.error(`File not found at: ${targetPath}`);
    process.exit(1);
  }

  console.log(`Connecting to MongoDB (${env.MONGO_URI})...`);
  await mongoose.connect(env.MONGO_URI);

  console.log(`Reading users from ${targetPath}...`);
  const raw = fs.readFileSync(targetPath, "utf8");
  const docs = JSON.parse(raw);

  const defaultPassword = "Password123";
  console.log(`Hashing default password (${defaultPassword})...`);
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  let importedCount = 0;
  for (let doc of docs) {
    doc = convertExtendedJson(doc);
    doc.passwordHash = passwordHash;
    doc.status = "active";
    doc.isActive = true;
    if (doc.role !== "admin") {
      doc.twoFactorEnabled = false;
    }
    delete doc.__v;

    await User.findOneAndUpdate(
      { email: doc.email },
      { $set: doc },
      { upsert: true, new: true }
    );
    importedCount++;
  }

  console.log(`\n🎉 Successfully imported/updated ${importedCount} users into 'users' collection!`);
  console.log(`🔑 All imported accounts can now log in with password: ${defaultPassword}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error importing users:", err);
  process.exit(1);
});
