export interface ProductImage {
  id: number;
  url: string;
  isPrimary: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  created_at: Date;
  updated_at: Date;
  images: ProductImage[];
} 