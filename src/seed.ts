import { getPayload } from "payload";
import config from "@payload-config";

const categories = [
  {
    name: "Electronics",
    color: "#7EC8E3",
    slug: "electronics",
    subcategories: [
      { name: "Smartphones", slug: "smartphones" },
      { name: "Laptops", slug: "laptops" },
      { name: "Tablets", slug: "tablets" },
      { name: "Cameras", slug: "cameras" },
      { name: "TVs & Home Theater", slug: "tvs-home-theater" },
      { name: "Audio & Headphones", slug: "audio-headphones" },
      { name: "Wearables", slug: "wearables" },
      { name: "Accessories", slug: "electronics-accessories" },
    ],
  },
  {
    name: "Home & Kitchen",
    color: "#FFB347",
    slug: "home-kitchen",
    subcategories: [
      { name: "Furniture", slug: "furniture" },
      { name: "Kitchen Appliances", slug: "kitchen-appliances" },
      { name: "Cookware & Utensils", slug: "cookware-utensils" },
      { name: "Bedding & Bath", slug: "bedding-bath" },
      { name: "Décor", slug: "decor" },
      { name: "Storage & Organization", slug: "storage-organization" },
    ],
  },
  {
    name: "Fashion",
    color: "#D8B5FF",
    slug: "fashion",
    subcategories: [
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Women's Clothing", slug: "womens-clothing" },
      { name: "Kids' Clothing", slug: "kids-clothing" },
      { name: "Shoes", slug: "shoes" },
      { name: "Accessories", slug: "fashion-accessories" },
    ],
  },
  {
    name: "Beauty & Personal Care",
    color: "#FFCAB0",
    slug: "beauty-personal-care",
    subcategories: [
      { name: "Skincare", slug: "skincare" },
      { name: "Makeup", slug: "makeup" },
      { name: "Hair Care", slug: "hair-care" },
      { name: "Fragrance", slug: "fragrance" },
      { name: "Personal Care Appliances", slug: "personal-care-appliances" },
    ],
  },
  {
    name: "Sports & Outdoors",
    color: "#96E6B3",
    slug: "sports-outdoors",
    subcategories: [
      { name: "Fitness Equipment", slug: "fitness-equipment" },
      { name: "Camping & Hiking", slug: "camping-hiking" },
      { name: "Cycling", slug: "cycling" },
      { name: "Team Sports", slug: "team-sports" },
      { name: "Outdoor Gear", slug: "outdoor-gear" },
    ],
  },
  {
    name: "Toys & Games",
    color: "#FFE066",
    slug: "toys-games",
    subcategories: [
      { name: "Action Figures & Collectibles", slug: "action-figures" },
      { name: "Board Games & Puzzles", slug: "board-games-puzzles" },
      { name: "Educational Toys", slug: "educational-toys" },
      { name: "Outdoor Play", slug: "outdoor-play" },
    ],
  },
  {
    name: "Automotive",
    slug: "automotive",
    subcategories: [
      { name: "Car Accessories", slug: "car-accessories" },
      { name: "Replacement Parts", slug: "replacement-parts" },
      { name: "Tools & Equipment", slug: "auto-tools-equipment" },
      { name: "Motorcycle Gear", slug: "motorcycle-gear" },
    ],
  },
  {
    name: "Health & Wellness",
    color: "#FF9AA2",
    slug: "health-wellness",
    subcategories: [
      { name: "Vitamins & Supplements", slug: "vitamins-supplements" },
      { name: "Medical Supplies", slug: "medical-supplies" },
      { name: "Personal Care", slug: "personal-care-items" },
    ],
  },
  {
    name: "Office & School Supplies",
    color: "#B5B9FF",
    slug: "office-school-supplies",
    subcategories: [
      { name: "Office Furniture", slug: "office-furniture" },
      { name: "Stationery", slug: "stationery" },
      { name: "Printers & Ink", slug: "printers-ink" },
      { name: "Organizers", slug: "organizers" },
    ],
  },
  {
    name: "Pet Supplies",
    color: "#FFD700",
    slug: "pet-supplies",
    subcategories: [
      { name: "Dog Supplies", slug: "dog-supplies" },
      { name: "Cat Supplies", slug: "cat-supplies" },
      { name: "Pet Food & Treats", slug: "pet-food-treats" },
      { name: "Pet Accessories", slug: "pet-accessories" },
    ],
  },
  {
    name: "Garden & Outdoor",
    color: "#96E6B3",
    slug: "garden-outdoor",
    subcategories: [
      { name: "Garden Tools", slug: "garden-tools" },
      { name: "Outdoor Furniture", slug: "outdoor-furniture" },
      { name: "Grills & Outdoor Cooking", slug: "grills-outdoor-cooking" },
      { name: "Plants & Seeds", slug: "plants-seeds" },
    ],
  },
  {
    name: "Baby & Child",
    color: "#FFCAB0",
    slug: "baby-child",
    subcategories: [
      { name: "Strollers & Car Seats", slug: "strollers-car-seats" },
      { name: "Feeding & Nursing", slug: "feeding-nursing" },
      { name: "Diapering", slug: "diapering" },
      { name: "Nursery Furniture", slug: "nursery-furniture" },
    ],
  },
  {
    name: "Tools & Home Improvement",
    color: "#B5B9FF",
    slug: "tools-home-improvement",
    subcategories: [
      { name: "Power Tools", slug: "power-tools" },
      { name: "Hand Tools", slug: "hand-tools" },
      { name: "Hardware", slug: "hardware" },
      { name: "Paint & Supplies", slug: "paint-supplies" },
    ],
  },
  {
    name: "Music & Instruments",
    color: "#FF6B6B",
    slug: "music-instruments",
    subcategories: [
      { name: "Guitars & String", slug: "guitars-string" },
      { name: "Keyboards & Pianos", slug: "keyboards-pianos" },
      { name: "Drums & Percussion", slug: "drums-percussion" },
      { name: "Recording Equipment", slug: "recording-equipment" },
    ],
  },
  {
    name: "Books & Media",
    color: "#FFD700",
    slug: "books-media",
    subcategories: [
      { name: "Fiction", slug: "books-fiction" },
      { name: "Non-Fiction", slug: "books-non-fiction" },
      { name: "Magazines", slug: "magazines" },
      { name: "Movies & TV", slug: "movies-tv" },
    ],
  },
  {
    name: "Video Games & Consoles",
    color: "#7EC8E3",
    slug: "video-games",
    subcategories: [
      { name: "Consoles", slug: "consoles" },
      { name: "Games", slug: "games" },
      { name: "Accessories", slug: "gaming-accessories" },
    ],
  },
  {
    name: "Grocery & Gourmet Food",
    color: "#FFB347",
    slug: "grocery-gourmet",
    subcategories: [
      { name: "Pantry Staples", slug: "pantry-staples" },
      { name: "Snacks & Beverages", slug: "snacks-beverages" },
      { name: "Specialty Foods", slug: "specialty-foods" },
    ],
  },
  {
    name: "Jewelry & Watches",
    color: "#FFCAB0",
    slug: "jewelry-watches",
    subcategories: [
      { name: "Necklaces & Pendants", slug: "necklaces-pendants" },
      { name: "Rings", slug: "rings" },
      { name: "Watches", slug: "watches" },
      { name: "Earrings", slug: "earrings" },
    ],
  },
  {
    name: "Handmade & Crafts",
    color: "#D8B5FF",
    slug: "handmade-crafts",
    subcategories: [
      { name: "Handmade Jewelry", slug: "handmade-jewelry" },
      { name: "Art & Prints", slug: "art-prints" },
      { name: "Home Crafts", slug: "home-crafts" },
    ],
  },
];

const seed = async () => {
  const payload = await getPayload({ config });

  const log = (...args: any[]) => console.log("[seed]", ...args);

  // Always bypass access checks for seeding
  const opts = { overrideAccess: true } as const;

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const isTransientWriteError = (e: any) => {
    const code = e?.code;
    const name = e?.codeName;
    const labels: string[] = e?.errorResponse?.errorLabels || e?.errorLabels || [];
    return code === 112 || name === "WriteConflict" || labels.includes("TransientTransactionError");
  };

  const createWithRetry = async <T = any>(
    collection: string,
    data: any,
    unique?: { field: string; value: any },
    maxRetries = 5
  ): Promise<T> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (unique) {
          const existing = await payload.find({
            collection: collection as any,
            where: { [unique.field]: { equals: unique.value } },
            limit: 1,
            ...opts,
          });
          if (existing.docs && existing.docs.length > 0) {
            return existing.docs[0] as T;
          }
        }
        const created = await payload.create({ collection: collection as any, data, ...opts });
        return created as T;
      } catch (e: any) {
        if (isTransientWriteError(e) && attempt < maxRetries - 1) {
          await sleep(50 * Math.pow(2, attempt));
          continue;
        }
        throw e;
      }
    }
    throw new Error(`Failed to create in ${collection} after ${maxRetries} attempts`);
  };

  // 1) Super admin
  log("creating super admin user...");
  const superAdmin = await createWithRetry("users", {
    email: "admin@demo.com",
    password: "demo",
    roles: ["super-admin"],
    username: "admin",
  }, { field: "email", value: "admin@demo.com" });

  // 2) Tenants
  log("creating tenants...");
  const tenantInputs = [
    {
      name: "Alpha Store",
      slug: "alpha-store",
      description: "Electronics and lifestyle goods",
      stripeAccountId: "acct_alpha_123",
      stripeDetailsSubmitted: true,
    },
    {
      name: "Beta Bazaar",
      slug: "beta-bazaar",
      description: "Home, kitchen and fashion essentials",
      stripeAccountId: "acct_beta_123",
      stripeDetailsSubmitted: true,
    },
    {
      name: "Gamma Goods",
      slug: "gamma-goods",
      description: "Sports, outdoors and more",
      stripeAccountId: "acct_gamma_123",
      stripeDetailsSubmitted: true,
    },
  ];

  const tenants: Array<{ id: string; slug: string; name: string }> = [];
  for (const t of tenantInputs) {
    const created = await createWithRetry("tenants", t, { field: "slug", value: t.slug });
    tenants.push({ id: created.id, slug: created.slug, name: created.name });
  }

  // 3) Owners and customers
  log("creating store owners and customers...");
  const ownerInputs: Array<{
    email: string;
    username: string;
    password: string;
    tenants: Array<{ tenant: string }>;
    roles: ("user" | "super-admin")[];
  }> = [
    {
      email: "owner1@demo.com",
      username: "owner1",
      password: "demo",
      tenants: [{ tenant: tenants[0]!.id }],
      roles: ["user"],
    },
    {
      email: "owner2@demo.com",
      username: "owner2",
      password: "demo",
      tenants: [{ tenant: tenants[1]!.id }],
      roles: ["user"],
    },
    {
      email: "owner3@demo.com",
      username: "owner3",
      password: "demo",
      tenants: [{ tenant: tenants[2]!.id }],
      roles: ["user"],
    },
  ];
  const owners = [] as Array<{ id: string; email: string }>;
  for (const u of ownerInputs) {
    const created = await createWithRetry("users", u, { field: "email", value: u.email });
    owners.push({ id: created.id, email: created.email });
  }

  const customerInputs: Array<{
    email: string;
    username: string;
    password: string;
    roles: ("user" | "super-admin")[];
  }> = [
    { email: "jane@demo.com", username: "jane", password: "demo", roles: ["user"] },
    { email: "john@demo.com", username: "john", password: "demo", roles: ["user"] },
    { email: "mike@demo.com", username: "mike", password: "demo", roles: ["user"] },
    { email: "sara@demo.com", username: "sara", password: "demo", roles: ["user"] },
  ];
  const customers = [] as Array<{ id: string; email: string; username: string }>;
  for (const u of customerInputs) {
    const created = await createWithRetry("users", u, { field: "email", value: u.email });
    customers.push({ id: created.id, email: created.email, username: u.username });
  }

  // 4) Tags
  log("creating tags...");
  const tagNames = [
    "New",
    "Popular",
    "Sale",
    "Limited",
    "Eco-friendly",
    "Premium",
    "Budget",
    "Trending",
  ];
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const created = await createWithRetry("tags", { name }, { field: "name", value: name });
    tagIds.push(created.id);
  }

  // 5) Categories and subcategories (as provided)
  log("creating categories and subcategories...");
  const categoryBySlug = new Map<string, { id: string; name: string }>();
  const allSubcategories: Array<{ id: string; name: string; slug: string; parentId: string; parentName: string }> = [];
  for (const category of categories) {
    const parentCategory = await createWithRetry("categories", {
      name: category.name,
      slug: category.slug,
      color: category.color,
      parent: null,
    }, { field: "slug", value: category.slug });
    categoryBySlug.set(category.slug, { id: parentCategory.id, name: parentCategory.name });

    for (const subCategory of category.subcategories || []) {
      const createdSub = await createWithRetry("categories", {
        name: subCategory.name,
        slug: subCategory.slug,
        parent: parentCategory.id,
      }, { field: "slug", value: subCategory.slug });
      allSubcategories.push({
        id: createdSub.id,
        name: createdSub.name,
        slug: createdSub.slug,
        parentId: parentCategory.id,
        parentName: parentCategory.name,
      });
    }
  }

  // Helpers
  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const sample = <T,>(arr: T[], n: number) => arr.slice().sort(() => 0.5 - Math.random()).slice(0, n);

  // 6) Products (2-3 per subcategory) and reviews
  log("creating products and reviews per subcategory...");
  const createdProducts: Array<{ id: string; name: string }> = [];
  let subcategoryIndex = 0;
  for (const sub of allSubcategories) {
    const count = 2 + randInt(0, 1); // 2 or 3 per subcategory
    for (let i = 0; i < count; i++) {
      const tenant = tenants[subcategoryIndex % tenants.length]!;
      const chosenTags = sample(tagIds, 2 + randInt(0, 1));
      const price = Number((Math.random() * 400 + 9.99).toFixed(2));
      const productName = `${sub.parentName} / ${sub.name} Product ${i + 1}`;

      const product = await payload.create({
        collection: "products",
        data: {
          tenant: tenant.id,
          name: productName,
          price,
          category: sub.id,
          tags: chosenTags,
          refundPolicy: "30-day",
          isArchived: false,
          isPrivate: false,
        },
        ...opts,
      });
      createdProducts.push({ id: product.id, name: product.name });

      // 2-3 reviews per product
      const reviewsCount = 2 + randInt(0, 1);
      const reviewers = sample(customers, reviewsCount);
      for (let r = 0; r < reviewsCount; r++) {
        const reviewer = reviewers[r]!;
        const rating = randInt(4, 5);
        const phrases = [
          "Great quality and value!",
          "Exceeded expectations.",
          "Would buy again.",
          "Solid product, fast shipping.",
          "Highly recommend!",
        ];
        const description = `${phrases[randInt(0, phrases.length - 1)]} (${productName})`;

        await payload.create({
          collection: "reviews",
          data: {
            description,
            rating,
            product: product.id,
            user: reviewer.id,
          },
          ...opts,
        });
      }
    }
    subcategoryIndex++;
  }

  log(`created ${tenants.length} tenants, ${owners.length} owners, ${customers.length} customers, ${tagIds.length} tags, ${createdProducts.length} products with reviews across ${allSubcategories.length} subcategories.`);
};

try {
    await seed();
    console.log('seeding completed successfully');
    process.exit(0)
} catch (error) {
    console.error('Error during seeding: ', error);
    process.exit(1)
}