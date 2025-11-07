"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { account, databases, teams, ID } from "@/lib/appwrite";
import { Permission, Role } from "appwrite";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userTeams, setUserTeams] = useState<string[]>([]);

  const router = useRouter();

  const EDITORS_TEAM_ID = process.env.NEXT_PUBLIC_EDITORS_TEAM_ID!;
  const VIEWERS_TEAM_ID = process.env.NEXT_PUBLIC_VIEWERS_TEAM_ID!;

  const isEditor = userTeams.includes(EDITORS_TEAM_ID);

  // 🔐 Check if logged in + fetch teams
  useEffect(() => {
    const init = async () => {
      try {
        const user = await account.get();
        setUser(user);

        // Fetch user's teams using Teams SDK
        const userTeamsRes = await teams.list();
        const teamIds = userTeamsRes.teams.map((team: any) => team.$id);
        setUserTeams(teamIds);

        await loadProducts();
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 📦 Load all products
  const loadProducts = async () => {
    try {
      const res = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!
      );
      setProducts(res.documents);
    } catch (e: any) {
      setError("Failed to load products");
    }
  };

  // ➕ Create / ✏️ Update (Editors only)
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!isEditor) return;

    try {
      if (editingId) {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!,
          editingId,
          formData
        );
      } else {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!,
          ID.unique(),
          formData,
          [
            Permission.read(Role.team(EDITORS_TEAM_ID)),
            Permission.read(Role.team(VIEWERS_TEAM_ID)),
            Permission.create(Role.team(EDITORS_TEAM_ID)),
            Permission.update(Role.team(EDITORS_TEAM_ID)),
            Permission.delete(Role.team(EDITORS_TEAM_ID)),
          ]
        );
      }

      setFormData({});
      setEditingId(null);
      await loadProducts();
    } catch (e: any) {
      setError("Failed to save product");
    }
  };

  // ✏️ Edit product
  const handleEdit = (product: any) => {
    if (!isEditor) return;

    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      inStock: product.inStock,
    });
    setEditingId(product.$id);
  };

  // ❌ Delete product
  const handleDelete = async (id: string) => {
    if (!isEditor) return;

    if (!confirm("Delete this product?")) return;
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!,
        id
      );
      await loadProducts();
    } catch {
      setError("Failed to delete product");
    }
  };

  // 🔙 Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  // 🚪 Logout
  const handleLogout = async (e: any) => {
    e.preventDefault();
    await account.deleteSession("current");
    router.push("/login");
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  if (!user)
    return (
      <main className="container" style={{ maxWidth: 420, margin: "40px auto" }}>
        <p>Not logged in. Redirecting...</p>
      </main>
    );

  return (
    <main className="container">
      <h1>🛍️ Product Management</h1>

      {error && <p className="error">{error}</p>}

      {/* FORM: only Editors */}
      {isEditor ? (
        <form onSubmit={handleSubmit} className="form">
          <h2>{editingId ? "Update Product" : "Add New Product"}</h2>

          <label>
            Name:
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </label>

          <label>
            Price:
            <input
              type="number"
              value={formData.price || ""}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) })
              }
              required
            />
          </label>

          <label>
            Description:
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </label>

          <label>
            Category:
            <input
              type="text"
              value={formData.category || ""}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={formData.inStock ?? true}
              onChange={(e) =>
                setFormData({ ...formData, inStock: e.target.checked })
              }
            />
            In Stock
          </label>

          <button type="submit">{editingId ? "Update" : "Create"}</button>
          <button onClick={handleLogout}>Logout</button>
          {editingId && (
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </form>
      ) : (
        <p style={{ textAlign: "center" }}>
          👀 You are a Viewer — read-only access
          <br />
          <button onClick={handleLogout}>Logout</button>
        </p>
      )}

      {/* PRODUCT LIST (everyone can see) */}
      <section className="product-list">
        {products.length === 0 && <p>No products found.</p>}
        {products.map((p) => (
          <div key={p.$id} className="product-card">
            <h3>{p.name}</h3>
            <p>
              <strong>₱{Number(p.price).toFixed(2)}</strong>
            </p>
            <p>{p.description || "No description"}</p>
            <p>
              <em>{p.category || "Uncategorized"}</em>
            </p>
            <p>{p.inStock ? "✅ In Stock" : "❌ Out of Stock"}</p>

            {/* only editors can see edit/delete buttons */}
            {isEditor && (
              <div className="actions">
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button className="delete" onClick={() => handleDelete(p.$id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </section>

      <style jsx>{`
        /* Your existing styles unchanged */
        .container { max-width: 800px; margin: 40px auto; padding: 20px; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; color: #222; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1,h2 { text-align: center; color: #2c3e50; }
        .error { color: #b71c1c; background: #ffebee; padding: 10px; border-radius: 6px; text-align: center; margin-bottom: 10px; }
        .form { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
        label { display: block; margin-bottom: 12px; color: #333; font-weight: 500; }
        input,textarea { width: 100%; padding: 10px; margin-top: 4px; border: 1px solid #ccc; border-radius: 6px; background: #fafafa; color: #222; font-size: 15px; }
        input:focus,textarea:focus { border-color: #007bff; outline: none; background: #fff; }
        .checkbox { display: flex; align-items: center; gap: 8px; color: #333; margin-top: 10px; }
        button { background: #007bff; color: white; border: none; padding: 10px 14px; margin-right: 8px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s ease; }
        button:hover { background: #0056b3; }
        .delete { background: #dc3545; }
        .delete:hover { background: #b52b27; }
        .product-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
        .product-card { border: 1px solid #ddd; border-radius: 10px; padding: 16px; background: #fff; color: #333; box-shadow: 0 2px 6px rgba(0,0,0,0.05); transition: transform 0.1s ease, box-shadow 0.2s ease; }
        .product-card:hover { transform: translateY(-2px); box-shadow: 0 3px 8px rgba(0,0,0,0.1); }
        .actions { display: flex; justify-content: space-between; margin-top: 12px; }
      `}</style>
    </main>
  );
}
