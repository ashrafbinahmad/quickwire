// Seed script to create initial users and todos
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await hashPassword('password123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });
  console.log('Created/updated admin user:', admin.email);

  // Create regular user
  const userPassword = await hashPassword('password123');
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Regular User',
      email: 'user@example.com',
      password: userPassword,
      role: 'USER'
    }
  });
  console.log('Created/updated regular user:', user.email);

  // Create some sample todos for the regular user
  const sampleTodos = [
    { title: 'Learn Quickwire', description: 'Explore the automatic API generation features' },
    { title: 'Build a todo app', description: 'Create a full-featured todo application' },
    { title: 'Setup authentication', description: 'Implement JWT-based authentication' },
    { title: 'Test role-based access', description: 'Verify admin and user permissions work correctly' },
    { title: 'Deploy to production', description: 'Deploy the application to a hosting platform' }
  ];

  for (const todo of sampleTodos) {
    // Check if todo already exists
    const existingTodo = await prisma.todo.findFirst({
      where: { 
        title: todo.title, 
        userId: user.id 
      }
    });
    
    // Create only if it doesn't exist
    if (!existingTodo) {
      await prisma.todo.create({
        data: {
          ...todo,
          userId: user.id
        }
      });
    }
  }
  console.log('Created sample todos for user');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });