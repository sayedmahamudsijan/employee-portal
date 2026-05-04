"use server";

import { prisma } from "@/lib/prisma";

export async function createNotification({
  userId,
  type,
  message,
  link,
}: {
  userId: string;
  type: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: { userId, type, message, link },
  });
}

export async function createNotificationForMany(
  userIds: string[],
  type: string,
  message: string,
  link?: string
) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, message, link })),
  });
}
