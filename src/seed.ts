import { User } from './entities/user.entity';
import { FixedCost } from './entities/fixed-cost.entity';
import { Role } from './enums/role.enum';
import bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

interface AdminUser {
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  phone: string;
  email: string;
  password: string;
  confirm_password: string;
  address: string;
  profile: string;
  roles: Role;
  is_active: boolean;
}

// Load environment variables
dotenv.config();

const { hash: bcryptHash } = bcrypt as unknown as {
  hash: (data: string, saltOrRounds: number) => Promise<string>;
};

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  synchronize: true,
  logging: false,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const userRepository = AppDataSource.getRepository(User);
    const fixedCostRepository = AppDataSource.getRepository(FixedCost);

    const adminPassword: string = await bcryptHash('password', 10);
    // Seed Admin
    const adminUserData: AdminUser = {
      first_name: 'ASAL',
      middle_name: 'PLC',
      last_name: 'ASAL',
      gender: 'male',
      phone: '+251905078826',
      email: 'admin@asal.com',
      password: adminPassword,
      confirm_password: adminPassword,
      address: '123 Main Street',
      profile: 'admin.png',
      roles: Role.ADMIN,
      is_active: true,
    };

    const existingUser = await userRepository.findOne({
      where: { email: adminUserData.email },
    });

    if (!existingUser) {
      const adminToSave = userRepository.create({
        id: randomUUID(),
        ...adminUserData,
      });
      await userRepository.save(adminToSave);
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Seed Fixed Costs
    const fixedCostsData = [
      {
        monthlyFixedCost: 50000,
        dailyFixedCost: 1667,
        description: 'Rent for office space',
      },
      {
        monthlyFixedCost: 15000,
        dailyFixedCost: 500,
        description: 'Utilities (electricity, water, internet)',
      },
      {
        monthlyFixedCost: 25000,
        dailyFixedCost: 833,
        description: 'Employee salaries',
      },
      {
        monthlyFixedCost: 10000,
        dailyFixedCost: 333,
        description: 'Insurance and licenses',
      },
      {
        monthlyFixedCost: 8000,
        dailyFixedCost: 267,
        description: 'Maintenance and repairs',
      },
      {
        monthlyFixedCost: 12000,
        dailyFixedCost: 400,
        description: 'Marketing and advertising',
      },
      {
        monthlyFixedCost: 6000,
        dailyFixedCost: 200,
        description: 'Office supplies and equipment',
      },
      {
        monthlyFixedCost: 3000,
        dailyFixedCost: 100,
        description: 'Software subscriptions',
      },
    ];

    for (const fixedCostData of fixedCostsData) {
      const existingFixedCost = await fixedCostRepository.findOne({
        where: { description: fixedCostData.description },
      });

      if (!existingFixedCost) {
        const fixedCostToSave = fixedCostRepository.create({
          id: randomUUID(),
          ...fixedCostData,
        });
        await fixedCostRepository.save(fixedCostToSave);
        console.log(
          `Fixed cost "${fixedCostData.description}" created successfully`,
        );
      } else {
        console.log(`Fixed cost "${fixedCostData.description}" already exists`);
      }
    }
    console.log(adminUserData);
    console.log(existingUser);
    console.log(fixedCostsData);
    console.log('Seeding completed successfully');
    await AppDataSource.destroy();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Seeding failed:', msg);
    process.exit(1);
  }
}

void seed();
