import prisma from '../lib/prisma';
import { getNearestStoreService } from './store.service';

export const getHomepageDataService = async (lat?: number, lng?: number) => {
  // 1. Fetch Categories for Navigation Bar
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true
    }
  });

  const categoriesWithPlaceholder = categories.map(cat => ({
    ...cat,
    icon: cat.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=random`
  }));

  // 2. Fetch Banners for Hero Section
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  });
  
  const bannersWithPlaceholder = banners.length > 0 ? banners : [
    {
      id: 0,
      title: 'Welcome Promo',
      imageUrl: 'https://placehold.co/1200x400/png?text=Welcome+Promo',
      linkUrl: '#',
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // 3. Find Nearest Store and Product List
  let nearestStore = null;
  let products: Record<string, unknown>[] = [];
  let storeInfo = null;

  // Fetch all active stores for StoreShowcase
  const stores = await prisma.store.findMany({
    where: { status: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true
    }
  });

  if (lat !== undefined && lng !== undefined) {
    nearestStore = await getNearestStoreService(lat, lng);
  } else if (stores.length > 0) {
    // Fallback to main store (first store) if location is not provided
    nearestStore = {
      ...stores[0],
      distance: 0,
      isOutOfRange: false
    };
  }

  if (nearestStore) {
    storeInfo = {
      id: nearestStore.id,
      name: nearestStore.name,
      distance: nearestStore.distance,
      isOutOfRange: nearestStore.isOutOfRange
    };

    // Fetch products available in this store
    const stocks = await prisma.stock.findMany({
      where: {
        storeId: nearestStore.id,
        quantity: { gt: 0 }
      },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true, deletedAt: null },
              take: 1
            },
            category: {
              select: { name: true }
            }
          }
        }
      },
      take: 12 // limit for homepage
    });

    products = stocks.map(stock => {
      const p = stock.product;
      const primaryImage = p.images.length > 0 
        ? p.images[0].imageUrl 
        : `https://placehold.co/400x400/png?text=${encodeURIComponent(p.name)}`;
      
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.basePrice,
        categoryName: p.category.name,
        imageUrl: primaryImage,
        stock: stock.quantity,
        storeId: nearestStore.id
      };
    });

    if (products.length === 0) {
      products = [
        {
          id: 0,
          name: 'Placeholder Product',
          slug: 'placeholder-product',
          price: 10000,
          categoryName: 'Uncategorized',
          imageUrl: 'https://placehold.co/400x400/png?text=No+Products+Yet',
          stock: 0,
          storeId: nearestStore.id
        }
      ];
    }
  } else {
    products = [
      {
        id: 0,
        name: 'Select location to see products',
        slug: 'no-location',
        price: 0,
        categoryName: 'Info',
        imageUrl: 'https://placehold.co/400x400/png?text=Select+Location',
        stock: 0,
        storeId: null
      }
    ];
  }

  // 4. Footer Info
  const footerInfo = {
    about: "Toko kami menyediakan kebutuhan sehari-hari dengan kualitas terbaik.",
    contact: {
      email: "support@toko.com",
      phone: "+62 812 3456 7890"
    },
    socials: [
      { name: "Instagram", url: "https://instagram.com/toko" },
      { name: "Facebook", url: "https://facebook.com/toko" }
    ]
  };

  return {
    categories: categoriesWithPlaceholder,
    banners: bannersWithPlaceholder,
    storeInfo,
    products,
    stores,
    footer: footerInfo
  };
};
