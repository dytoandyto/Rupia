import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[RUPIA SEED] Starting optional demo seed...');

  const email = 'demo@rupia.id';
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log('[RUPIA SEED] Demo user already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash('rupia123', 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: 'Budi Santoso',
      passwordHash,
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      notificationPreference: {
        create: {
          reminderTime: '20:30',
          activeDays: '1,2,3,4,5,6,7',
          pushEnabled: true,
          inAppEnabled: true,
        },
      },
    },
  });

  console.log('[RUPIA SEED] Created user:', user.name, `(${user.email})`);

  // Default Categories
  const categoriesData = [
    { name: 'Makanan & Minuman', icon: 'Utensils', color: '#f59e0b', type: 'EXPENSE', isDefault: true, isSystem: true },
    { name: 'Transportasi & Bensin', icon: 'Fuel', color: '#3b82f6', type: 'EXPENSE', isDefault: true, isSystem: true },
    { name: 'Belanja & Supermarket', icon: 'ShoppingBag', color: '#ec4899', type: 'EXPENSE', isDefault: true, isSystem: true },
    { name: 'Tagihan & Utilitas', icon: 'Zap', color: '#ef4444', type: 'EXPENSE', isDefault: true, isSystem: true },
    { name: 'Hiburan & Kopi', icon: 'Coffee', color: '#8b5cf6', type: 'EXPENSE', isDefault: true, isSystem: true },
    { name: 'Kesehatan', icon: 'HeartPulse', color: '#10b981', type: 'EXPENSE', isDefault: true, isSystem: true },
    { name: 'Gaji Pokok', icon: 'Briefcase', color: '#10b981', type: 'INCOME', isDefault: true, isSystem: true },
    { name: 'Freelance & Bisnis', icon: 'Laptop', color: '#06b6d4', type: 'INCOME', isDefault: true, isSystem: true },
    { name: 'Investasi', icon: 'TrendingUp', color: '#6366f1', type: 'INCOME', isDefault: true, isSystem: true },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: {
        ...cat,
        userId: user.id,
      },
    });
    categories[cat.name] = created;
  }

  // Wallets
  const mandiri = await prisma.wallet.create({
    data: {
      userId: user.id,
      name: 'Mandiri Livin',
      type: 'BANK',
      accountNo: '137-00-123456-7',
      color: '#1d4ed8',
      icon: 'Building2',
      openingBalance: 7500000n,
      recordedBalance: 7500000n,
      lastVerifiedBalance: 7500000n,
      lastReconciledAt: new Date(),
    },
  });

  const gopay = await prisma.wallet.create({
    data: {
      userId: user.id,
      name: 'GoPay',
      type: 'EWALLET',
      accountNo: '0812-3456-7890',
      color: '#00aed6',
      icon: 'Smartphone',
      openingBalance: 450000n,
      recordedBalance: 450000n,
      lastVerifiedBalance: 450000n,
      lastReconciledAt: new Date(),
    },
  });

  const cash = await prisma.wallet.create({
    data: {
      userId: user.id,
      name: 'Dompet Tunai',
      type: 'CASH',
      color: '#10b981',
      icon: 'Banknote',
      openingBalance: 300000n,
      recordedBalance: 300000n,
      lastVerifiedBalance: 300000n,
      lastReconciledAt: new Date(),
    },
  });

  // Recent demo transactions
  const now = new Date();
  const txs = [
    {
      userId: user.id,
      walletId: mandiri.id,
      categoryId: categories['Gaji Pokok'].id,
      type: 'INCOME',
      amount: 8500000n,
      description: 'Gaji Bulanan PT Maju Jaya',
      merchant: 'PT Maju Jaya',
      date: new Date(now.getFullYear(), now.getMonth(), 1),
    },
    {
      userId: user.id,
      walletId: gopay.id,
      categoryId: categories['Makanan & Minuman'].id,
      type: 'EXPENSE',
      amount: 45000n,
      description: 'Makan Siang Nasi Padang',
      merchant: 'RM Sederhana',
      date: new Date(now.getTime() - 24 * 3600 * 1000 * 2),
    },
    {
      userId: user.id,
      walletId: cash.id,
      categoryId: categories['Hiburan & Kopi'].id,
      type: 'EXPENSE',
      amount: 28000n,
      description: 'Kopi Kenangan Mantan',
      merchant: 'Kopi Kenangan',
      date: new Date(now.getTime() - 24 * 3600 * 1000 * 1),
    },
    {
      userId: user.id,
      walletId: mandiri.id,
      categoryId: categories['Belanja & Supermarket'].id,
      type: 'EXPENSE',
      amount: 320000n,
      description: 'Belanja Mingguan Indomaret',
      merchant: 'Indomaret Fresh',
      date: now,
    },
  ];

  for (const tx of txs) {
    await prisma.transaction.create({ data: tx });
  }

  // Monthly Budget
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      name: 'Anggaran Bulanan Pribadi',
      period: 'MONTHLY',
      startDate: startOfMonth,
      endDate: endOfMonth,
      totalLimit: 5000000n,
      allocations: {
        create: [
          {
            categoryId: categories['Makanan & Minuman'].id,
            allocatedAmount: 1800000n,
            allocatedPercentage: 36,
          },
          {
            categoryId: categories['Transportasi & Bensin'].id,
            allocatedAmount: 700000n,
            allocatedPercentage: 14,
          },
          {
            categoryId: categories['Belanja & Supermarket'].id,
            allocatedAmount: 1500000n,
            allocatedPercentage: 30,
          },
          {
            categoryId: categories['Tagihan & Utilitas'].id,
            allocatedAmount: 600000n,
            allocatedPercentage: 12,
          },
          {
            categoryId: categories['Hiburan & Kopi'].id,
            allocatedAmount: 400000n,
            allocatedPercentage: 8,
          },
        ],
      },
    },
  });

  // Financial Goal
  await prisma.financialGoal.create({
    data: {
      userId: user.id,
      name: 'Dana Darurat 6 Bulan',
      targetAmount: 30000000n,
      currentAmount: 12500000n,
      priority: 'HIGH',
      deadline: new Date(now.getFullYear(), 11, 31),
    },
  });

  console.log('[RUPIA SEED] Demo seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('[RUPIA SEED] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

