import prisma from '../src/lib/prisma';

async function main() {
  console.log('Seeding stores...');

  const storeLocations = [
    {
      name: 'PanenMart Pusat',
      slug: 'panenmart-pusat',
      city: 'Jakarta Selatan', // Using a valid city that Nominatim might resolve to
      province: 'DKI Jakarta',
      address: 'Jl. Sudirman No. 45',
      latitude: -6.2002,
      longitude: 106.8167,
      serviceRadius: 12,
      status: true,
    },
    {
      name: 'PanenMart Utara',
      slug: 'panenmart-utara',
      city: 'Jakarta Utara',
      province: 'DKI Jakarta',
      address: 'Jl. Pluit Raya No. 12',
      latitude: -6.1218,
      longitude: 106.7915,
      serviceRadius: 12,
      status: true,
    },
    {
      name: 'PanenMart Timur',
      slug: 'panenmart-timur',
      city: 'Jakarta Timur',
      province: 'DKI Jakarta',
      address: 'Jl. Pemuda No. 88',
      latitude: -6.1827,
      longitude: 106.8982,
      serviceRadius: 12,
      status: true,
    },
    {
      name: 'PanenMart Selatan',
      slug: 'panenmart-selatan',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      address: 'Jl. Kemang Raya No. 2',
      latitude: -6.2671,
      longitude: 106.8133,
      serviceRadius: 12,
      status: true,
    },
  ];

  for (const store of storeLocations) {
    await prisma.store.upsert({
      where: { slug: store.slug },
      update: {},
      create: store,
    });
    console.log(`Created/Verified store: ${store.name}`);
  }

  console.log('Stores seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
