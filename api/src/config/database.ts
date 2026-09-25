type PrismaLike = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
};

export const prisma: PrismaLike = {
  $connect: async () => undefined,
  $disconnect: async () => undefined,
};
