export type StorefrontProduct = {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  buttonLabel: string;
  buttonUrl: string;
};

export type StorefrontSocialLink = {
  label: string;
  url: string;
};

export type StorefrontData = {
  cover: {
    description: string;
    images: string[];
    tags: string[];
    buyNowPrice: number;
    buttonLabel: string;
    buttonUrl: string;
  };
  shop: {
    name: string;
    tagline: string;
    avatar: string;
    rating: string;
    followers: number;
    hours: string;
    address: string;
    joinedAt: string;
    website: string;
    socialLinks?: StorefrontSocialLink[];
  };
  products: StorefrontProduct[];
};

export const storefrontData: StorefrontData = {
  cover: {
    description:
      "In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relyingIn publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relyins",
    images: [
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=520&q=80",
    ],
    tags: ["AI", "Photo", "Arts"],
    buyNowPrice: 12,
    buttonLabel: "Buy now $12",
    buttonUrl: "",
  },
  shop: {
    name: "Becodemy",
    tagline: "You will get anything related to programming.",
    avatar:
      "https://api.dicebear.com/9.x/adventurer/svg?seed=Becodemy&backgroundColor=a855f7",
    rating: "N/A",
    followers: 0,
    hours: "Mon - Fri 9 am to 10pm",
    address: "653 Banani, Dhaka",
    joinedAt: "24/03/2025",
    website: "https://www.becodemy.com",
    socialLinks: [
      {
        label: "YT",
        url: "https://www.youtube.com",
      },
      {
        label: "X",
        url: "https://x.com",
      },
    ],
  },
  products: [
    {
      id: "iphone",
      title: "iPhone Creative Mockup",
      description: "A polished product visual ready for your storefront.",
      image:
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=720&q=80",
      price: 12,
      buttonLabel: "View Product",
      buttonUrl: "",
    },
    {
      id: "avatar",
      title: "3D Avatar Pack",
      description: "A character image pack for profile and brand visuals.",
      image:
        "https://api.dicebear.com/9.x/adventurer/svg?seed=ProductAvatar&backgroundColor=a855f7",
      price: 12,
      buttonLabel: "View Product",
      buttonUrl: "",
    },
    {
      id: "workspace",
      title: "Creator Workspace Kit",
      description: "A clean workspace asset kit for digital product pages.",
      image:
        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=720&q=80",
      price: 12,
      buttonLabel: "View Product",
      buttonUrl: "",
    },
  ],
};
