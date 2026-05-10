import { PlanCode, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { code: PlanCode.HOBBY },
    create: {
      code: PlanCode.HOBBY,
      name: 'Hobby',
      description: 'Free forever. BYO keys. 1 workspace, 4 panes.',
      priceMonthlyRub: 0,
      priceYearlyRub: 0,
      panesLimit: 4,
      workspacesLimit: 1,
      features: ['Bring your own keys', '1 workspace', '4 parallel panes', 'Community support'],
    },
    update: {},
  });

  await prisma.plan.upsert({
    where: { code: PlanCode.PRO },
    create: {
      code: PlanCode.PRO,
      name: 'Pro',
      description: 'For serious solo builders.',
      priceMonthlyRub: 199000, // 1990 RUB
      priceYearlyRub: 1990000, // 19900 RUB (~−17%)
      panesLimit: 16,
      workspacesLimit: 10,
      features: [
        'Unlimited prompts',
        '10 workspaces',
        '16 parallel panes',
        'MCP servers',
        'Priority builds',
        'Theme creator',
      ],
    },
    update: {},
  });

  await prisma.plan.upsert({
    where: { code: PlanCode.TEAM },
    create: {
      code: PlanCode.TEAM,
      name: 'Team',
      description: 'For squads. Per-seat.',
      priceMonthlyRub: 399000, // 3990 RUB
      priceYearlyRub: 3990000,
      panesLimit: 32,
      workspacesLimit: 50,
      features: [
        'Everything in Pro',
        'SSO',
        'Shared workspaces',
        'Admin console',
        'Audit log',
        'SCIM',
      ],
    },
    update: {},
  });

  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'adam@sepaito.ai';
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: 'Admin',
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
    update: { role: 'ADMIN' },
  });

  // First-party OAuth clients. redirect_uris use a custom URL scheme so the
  // OS deep-link prompt ("Open in Sepaito?") fires after the consent screen.
  await prisma.oAuthClient.upsert({
    where: { clientId: 'ide-desktop' },
    create: {
      clientId: 'ide-desktop',
      name: 'Sepaito Desktop',
      description: 'The Sepaito AI Agents IDE for macOS, Windows and Linux.',
      redirectUris: ['sepaito://oauth/callback'],
      allowedScopes: [
        'profile',
        'projects.read',
        'projects.write',
        'usage.write',
        'usage.read',
      ],
      requirePkce: true,
      isActive: true,
    },
    update: {},
  });

  console.log('Seeded plans + bootstrap admin + oauth clients:', adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
