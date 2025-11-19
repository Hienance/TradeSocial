import { getPayload } from "payload";
import config from "@payload-config";
import { stripe } from "./lib/stripe";

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
    const payload = await getPayload ({config});


  
    // Create admin tenant
    const adminTenant = await payload.create({
        collection: "tenants",
        data: {
            name: "admin",
            slug: "admin",
            stripeAccountId:  "acct_1SRqtJ7B7AidhjoX",
        }
    });

    // Create a super admin user
    await payload.create({
      collection: "users",
      data: {
        email: "admin@demo.com",
        password: "demo",
        roles: ["super-admin"],
        username: "admin",
      }
    })

    for (const category of categories) {
        const parentCategory = await payload.create({
            collection: "categories",
            data: {
                name: category.name,
                slug: category.slug,
                color: category.color,
                parent: null,
            },
        });

        for (const subCategory of category.subcategories || []) {
            await payload.create({
                collection: "categories",
                data: {
                    name: subCategory.name,
                    slug: subCategory.slug,
                    parent: parentCategory.id,
                },
            });
        }
    }
}

try {
    await seed();
    console.log('seeding completed successfully');
    process.exit(0)
} catch (error) {
    console.error('Error during seeding: ', error);
    process.exit(1)
}