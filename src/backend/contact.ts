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

export async function searchContacts(params: {
  query: string;
  limit?: number;
  offset?: number;
}) {
  const { query, limit = 10, offset = 0 } = params;
  
  try {
    const whereClause = {
      isDeleted: false,
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.contact.count({
        where: whereClause,
      }),
    ]);

    return {
      contacts,
      total,
      limit,
      offset,
      hasMore: offset + contacts.length < total,
    };
  } catch (error) {
    console.error('Search contacts error:', error);
    throw new Error('Failed to search contacts');
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
  console.log(params);
  // return params
  return prisma.contact.create({
    data: params,
  });
}

export async function updateContact(params: {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}) {
  const { id, ...updateData } = params;
  
  // Remove undefined values to avoid overwriting with undefined
  const cleanData = Object.fromEntries(
    Object.entries(updateData).filter(([_, value]) => value !== undefined)
  );
  
  return prisma.contact.update({
    where: { id },
    data: cleanData,
  });
}

export async function deleteContact(id: string) {
  return prisma.contact.update({
    where: { id },
    data: { isDeleted: true },
  });
}

export async function fn2() {
  console.log("Hi")
}

export async function andsy_Fn() {
  console.log("Hi")
  console.log("first")
}

export async function an() {
  console.log("Hi")
  console.log("first")
}
