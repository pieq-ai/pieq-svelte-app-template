import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const permissions = await prisma.permission.findMany();
  console.log("Permissions:", JSON.stringify(permissions, null, 2));

  const roles = await prisma.role.findMany();
  console.log("Roles:", JSON.stringify(roles, null, 2));

  const rolePermissions = await prisma.rolePermission.findMany({
    include: { role: true, permission: true }
  });
  console.log("RolePermissions:", JSON.stringify(rolePermissions, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
