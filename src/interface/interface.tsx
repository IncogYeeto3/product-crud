export default interface Product {
  $id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  inStock: boolean;
  $createdAt: string;
  $updatedAt: string;
}
