import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hackkro.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Hackkro2026';
    const adminName = process.env.ADMIN_NAME || 'HackKro Admin';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`[Seed] Admin already exists with email: ${adminEmail}`);
      process.exit(0);
    }

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    console.log(`[Seed] Successfully seeded initial admin account: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Failed to seed admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
