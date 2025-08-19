import { prisma } from "@/lib/prisma";

export async function listContacts() {
  try {
    return prisma.contact.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.log(error);
  }
}

export async function getContact(params: { id: string }) {
  return prisma.contact.findUnique({
    where: { id: params.id },
  });
}

export async function addContact(params: {
  name: string;
  email: string;
  phone?: string;
}) {
  return prisma.contact.create({
    data: params,
  });
}

export async function deleteContact(id: string) {
  return prisma.contact.update({
    where: { id },
    data: { isDeleted: true },
  });
}
