import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Users ────────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      password: passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@crm.com' },
    update: {},
    create: {
      email: 'staff@crm.com',
      password: passwordHash,
      name: 'Staff User',
      role: 'STAFF',
    },
  });

  await prisma.user.upsert({
    where: { email: 'marketing@crm.com' },
    update: {},
    create: {
      email: 'marketing@crm.com',
      password: passwordHash,
      name: 'Marketing User',
      role: 'MARKETING',
    },
  });

  console.log('✅ Users created');

  // ─── Customers ────────────────────────────────────────────────────────────────
  const customers = [
    {
      firstName: 'Somchai',
      lastName: 'Jaidee',
      email: 'somchai@example.com',
      tier: 'PLATINUM' as const,
      phone: '081-111-1111',
      dob: '1985-03-15',
      points: 12500,
      lifetime: 28000,
    },
    {
      firstName: 'Wanida',
      lastName: 'Sriwong',
      email: 'wanida@example.com',
      tier: 'GOLD' as const,
      phone: '082-222-2222',
      dob: '1990-07-22',
      points: 6800,
      lifetime: 15000,
    },
    {
      firstName: 'Prasert',
      lastName: 'Boonma',
      email: 'prasert@example.com',
      tier: 'GOLD' as const,
      phone: '083-333-3333',
      dob: '1988-11-05',
      points: 5200,
      lifetime: 12000,
    },
    {
      firstName: 'Nattaya',
      lastName: 'Chaiwong',
      email: 'nattaya@example.com',
      tier: 'SILVER' as const,
      phone: '084-444-4444',
      dob: '1995-01-30',
      points: 2100,
      lifetime: 5500,
    },
    {
      firstName: 'Kittisak',
      lastName: 'Phomma',
      email: 'kittisak@example.com',
      tier: 'SILVER' as const,
      phone: '085-555-5555',
      dob: '1992-09-18',
      points: 1800,
      lifetime: 4200,
    },
    {
      firstName: 'Siriporn',
      lastName: 'Thongdee',
      email: 'siriporn@example.com',
      tier: 'BRONZE' as const,
      phone: '086-666-6666',
      dob: '1998-05-12',
      points: 450,
      lifetime: 950,
    },
    {
      firstName: 'Chakrit',
      lastName: 'Nilkham',
      email: 'chakrit@example.com',
      tier: 'BRONZE' as const,
      phone: '087-777-7777',
      dob: '2000-12-25',
      points: 320,
      lifetime: 700,
    },
    {
      firstName: 'Malee',
      lastName: 'Kongsuk',
      email: 'malee@example.com',
      tier: 'BRONZE' as const,
      phone: '088-888-8888',
      dob: '1997-08-08',
      points: 180,
      lifetime: 400,
    },
    {
      firstName: 'Thanakorn',
      lastName: 'Srisuk',
      email: 'thanakorn@example.com',
      tier: 'SILVER' as const,
      phone: '089-999-9999',
      dob: '1993-04-20',
      points: 2900,
      lifetime: 6800,
    },
    {
      firstName: 'Pornpan',
      lastName: 'Ruangrat',
      email: 'pornpan@example.com',
      tier: 'BRONZE' as const,
      phone: '090-000-0000',
      dob: '2001-02-14',
      points: 90,
      lifetime: 200,
    },
  ];

  const createdCustomers: { id: string; email: string }[] = [];

  for (const c of customers) {
    const existing = await prisma.customer.findUnique({
      where: { email: c.email },
    });
    if (existing) {
      createdCustomers.push({ id: existing.id, email: existing.email });
      continue;
    }

    const customer = await prisma.customer.create({
      data: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        dateOfBirth: new Date(c.dob),
        tier: c.tier,
        loyaltyAccount: {
          create: {
            totalPoints: c.points,
            lifetimePoints: c.lifetime,
          },
        },
      },
    });
    createdCustomers.push({ id: customer.id, email: customer.email });
  }

  console.log(`✅ ${createdCustomers.length} customers created`);

  // ─── Loyalty Transactions ─────────────────────────────────────────────────────
  for (const { id: customerId } of createdCustomers.slice(0, 5)) {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { customerId },
    });
    if (!account) continue;

    const txCount = await prisma.loyaltyTransaction.count({
      where: { loyaltyAccountId: account.id },
    });
    if (txCount > 0) continue;

    await prisma.loyaltyTransaction.createMany({
      data: [
        {
          loyaltyAccountId: account.id,
          type: 'EARN',
          points: 500,
          description: 'Purchase - Order #1001',
        },
        {
          loyaltyAccountId: account.id,
          type: 'EARN',
          points: 300,
          description: 'Purchase - Order #1002',
        },
        {
          loyaltyAccountId: account.id,
          type: 'REDEEM',
          points: -200,
          description: 'Redeemed: Free Drink',
        },
        {
          loyaltyAccountId: account.id,
          type: 'EARN',
          points: 150,
          description: 'Purchase - Order #1003',
        },
        {
          loyaltyAccountId: account.id,
          type: 'ADJUST',
          points: 50,
          description: 'Bonus points - Birthday',
        },
      ],
    });
  }

  console.log('✅ Loyalty transactions created');

  // ─── Rewards ──────────────────────────────────────────────────────────────────
  const rewardsData = [
    {
      name: 'Free Coffee',
      description: 'Redeem for a free hot or iced coffee',
      pointsCost: 150,
      stock: 50,
    },
    {
      name: '10% Discount Coupon',
      description: 'Get 10% off your next purchase',
      pointsCost: 200,
      stock: 100,
    },
    {
      name: 'Free Dessert',
      description: 'Choose any dessert from the menu',
      pointsCost: 300,
      stock: 30,
    },
    {
      name: 'VIP Gift Set',
      description: 'Premium gift set for VIP members',
      pointsCost: 1000,
      stock: 10,
    },
    {
      name: 'Birthday Bonus Pack',
      description: 'Special pack for birthday month',
      pointsCost: 500,
      stock: 25,
    },
  ];

  for (const r of rewardsData) {
    const existing = await prisma.reward.findFirst({ where: { name: r.name } });
    if (!existing) {
      await prisma.reward.create({ data: r });
    }
  }

  console.log('✅ Rewards created');

  // ─── Campaigns ────────────────────────────────────────────────────────────────
  const campaignsData = [
    {
      name: 'Summer Double Points',
      description: 'Earn 2x points on all purchases during summer',
      type: 'POINTS_MULTIPLIER' as const,
      pointsMultiplier: 2.0,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-31'),
      isActive: true,
    },
    {
      name: 'New Member Welcome Bonus',
      description: '500 bonus points for new members',
      type: 'BONUS_POINTS' as const,
      bonusPoints: 500,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
    {
      name: 'Weekend Discount',
      description: '15% off every weekend',
      type: 'DISCOUNT' as const,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
    },
    {
      name: 'Platinum Free Reward',
      description: 'Platinum members get a free reward monthly',
      type: 'FREE_REWARD' as const,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
    {
      name: 'Year-End Triple Points',
      description: 'Earn 3x points in December',
      type: 'POINTS_MULTIPLIER' as const,
      pointsMultiplier: 3.0,
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-31'),
      isActive: false,
    },
  ];

  for (const c of campaignsData) {
    const existing = await prisma.campaign.findFirst({
      where: { name: c.name },
    });
    if (!existing) {
      await prisma.campaign.create({ data: c });
    }
  }

  console.log('✅ Campaigns created');

  // ─── Reward Redemptions ───────────────────────────────────────────────────────
  const rewards = await prisma.reward.findMany({ take: 3 });
  if (rewards.length > 0 && createdCustomers.length > 0) {
    for (const customer of createdCustomers.slice(0, 3)) {
      const existing = await prisma.rewardRedemption.findFirst({
        where: { customerId: customer.id },
      });
      if (!existing && rewards[0]) {
        await prisma.rewardRedemption.create({
          data: {
            customerId: customer.id,
            rewardId: rewards[0].id,
            pointsUsed: rewards[0].pointsCost,
            status: 'COMPLETED',
          },
        });
      }
    }
  }

  console.log('✅ Redemptions created');
  console.log('\n🎉 Seed completed!\n');
  console.log('📋 Demo accounts:');
  console.log('   Admin:     admin@crm.com     / password123');
  console.log('   Staff:     staff@crm.com     / password123');
  console.log('   Marketing: marketing@crm.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
