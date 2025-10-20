"use client";

import { useState, useEffect } from "react";
import { databases, ID } from "@/lib/appwrite";

interface Product {
  $id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  inStock: boolean;
}

export default function ProductsPage() {
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    price: 0,
    description: "",
    category: "",
    inStock: true,
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  // Load all products
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await databases.listDocuments(databaseId, collectionId);
      setProducts(res.documents as any);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        // UPDATE
        await databases.updateDocument(databaseId, collectionId, editingId, formData);
      } else {
        // CREATE
        await databases.createDocument(databaseId, collectionId, ID.unique(), formData);
      }
      setFormData({ name: "", price: 0, description: "", category: "", inStock: true });
      setEditingId(null);
      await loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleEdit(product: Product) {
    setEditingId(product.$id);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      inStock: product.inStock,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setEditingId(null);
    setFormData({
      name: "",
      price: 0,
      description: "",
      category: "",
      inStock: true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await databases.deleteDocument(databaseId, collectionId, id);
      await loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="container">
      <h1>🛍️ Product Management</h1>

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="form">
        <h2>{editingId ? "Update Product" : "Add New Product"}</h2>

        <label>
          Name:
          <input
            type="text"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </label>

        <label>
          Price:
          <input
            type="number"
            value={formData.price || ""}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            required
          />
        </label>

        <label>
          Description:
          <textarea
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </label>

        <label>
          Category:
          <input
            type="text"
            value={formData.category || ""}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.inStock ?? true}
            onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
          />
          In Stock
        </label>

        <button type="submit">{editingId ? "Update" : "Create"}</button>
        {editingId && (
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </form>

      {/* PRODUCT LIST */}
      <section className="product-list">
        {products.length === 0 && !loading && <p>No products found.</p>}
        {products.map((p) => (
          <div key={p.$id} className="product-card">
            <h3>{p.name}</h3>
            <p><strong>₱{p.price.toFixed(2)}</strong></p>
            <p>{p.description || "No description"}</p>
            <p><em>{p.category || "Uncategorized"}</em></p>
            <p>{p.inStock ? "✅ In Stock" : "❌ Out of Stock"}</p>

            <div className="actions">
              <button onClick={() => handleEdit(p)}>Edit</button>
              <button className="delete" onClick={() => handleDelete(p.$id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>

      <style jsx>{`
  /* General layout */
  .container {
    max-width: 800px;
    margin: 40px auto;
    padding: 20px;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f5f7fa;
    color: #222;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  h1, h2 {
    text-align: center;
    color: #2c3e50;
  }

  .error {
    color: #b71c1c;
    background: #ffebee;
    padding: 10px;
    border-radius: 6px;
    text-align: center;
    margin-bottom: 10px;
  }

  /* Form styling */
  .form {
    background: #fff;
    border: 1px solid #ddd;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }

  label {
    display: block;
    margin-bottom: 12px;
    color: #333;
    font-weight: 500;
  }

  input, textarea {
    width: 100%;
    padding: 10px;
    margin-top: 4px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fafafa;
    color: #222;
    font-size: 15px;
  }

  input:focus, textarea:focus {
    border-color: #007bff;
    outline: none;
    background: #fff;
  }

  .checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #333;
    margin-top: 10px;
  }

  /* Buttons */
  button {
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 14px;
    margin-right: 8px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s ease;
  }

  button:hover {
    background: #0056b3;
  }

  .delete {
    background: #dc3545;
  }

  .delete:hover {
    background: #b52b27;
  }

  /* Product list */
  .product-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .product-card {
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 16px;
    background: #fff;
    color: #333;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    transition: transform 0.1s ease, box-shadow 0.2s ease;
  }

  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.1);
  }

  .product-card h3 {
    color: #1a237e;
    margin-bottom: 6px;
  }

  .product-card p {
    margin: 4px 0;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
  }
`}</style>

    </main>
  );
}
