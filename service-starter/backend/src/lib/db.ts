import { PrismaClient } from '@prisma/client';

declare global {
  var __selfAwarenessPrisma__: PrismaClient | undefined;
}

export type DbClient = PrismaClient;

export function createDbClient(): PrismaClient {
  if (!global.__selfAwarenessPrisma__) {
    global.__selfAwarenessPrisma__ = new PrismaClient();
  }
  return global.__selfAwarenessPrisma__;
}
