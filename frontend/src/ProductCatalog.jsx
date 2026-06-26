import { useEffect, useMemo, useState } from "react";
import { Box, Typography, IconButton, Button, Container, Dialog, DialogContent } from "@mui/material";
import { Search, SlidersHorizontal, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import { api } from "./api";

const ITEMS_PER_PAGE = 6;

const emptyForm = {
  productName: "",
  brand: "",
  category: "Milk",
  price: "",
  rating: "",
  stock: "",
};

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [status, setStatus] = useState({ loading: true, error: "" });

  const inventoryByProductId = useMemo(
    () => new Map(inventory.map((item) => [item.productId?._id || item.productId, item])),
    [inventory]
  );

  const loadData = async () => {
    try {
      const [productRows, inventoryRows] = await Promise.all([api.listProducts(), api.listInventory()]);
      setProducts(productRows);
      setInventory(inventoryRows);
    } catch (error) {
      setStatus({ loading: false, error: error.message });
      return;
    }
    setStatus({ loading: false, error: "" });
  };

  useEffect(() => {
    let isMounted = true;

    // Initial load uses the backend API once the component is mounted.
    Promise.all([api.listProducts(), api.listInventory()])
      .then(([productRows, inventoryRows]) => {
        if (!isMounted) return;
        setProducts(productRows);
        setInventory(inventoryRows);
        setStatus({ loading: false, error: "" });
      })
      .catch((error) => {
        if (!isMounted) return;
        setStatus({ loading: false, error: error.message });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const tableRows = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        stock: inventoryByProductId.get(product._id)?.availableQuantity ?? 0,
        inventoryId: inventoryByProductId.get(product._id)?._id,
      })),
    [products, inventoryByProductId]
  );

  const filtered = tableRows.filter((product) => {
    const matchCat = activeCategory === "All" || product.category === activeCategory;
    const text = `${product.productName} ${product.brand} ${product.category}`.toLowerCase();
    return matchCat && text.includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName,
      brand: product.brand,
      category: product.category,
      price: String(product.price),
      rating: String(product.rating ?? 0),
      stock: String(product.stock ?? 0),
    });
    setShowAddModal(true);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setFormData({ ...emptyForm, category: categories.find((cat) => cat !== "All") || "Milk" });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProduct(id);
      await loadData();
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  const handleSubmit = async () => {
    if (!formData.productName || !formData.brand || !formData.category || formData.price === "") return;

    const payload = {
      productName: formData.productName,
      brand: formData.brand,
      category: formData.category,
      price: Number(formData.price),
      rating: Number(formData.rating) || 0,
    };
    const stockPayload = { availableQuantity: Number(formData.stock) || 0 };

    try {
      // Product and stock are saved through separate backend resources.
      if (editingProduct) {
        const savedProduct = await api.updateProduct(editingProduct._id, payload);
        if (editingProduct.inventoryId) {
          await api.updateInventory(editingProduct.inventoryId, stockPayload);
        } else {
          await api.createInventory({ productId: savedProduct._id, ...stockPayload });
        }
      } else {
        const savedProduct = await api.createProduct(payload);
        await api.createInventory({ productId: savedProduct._id, ...stockPayload });
      }
      setShowAddModal(false);
      await loadData();
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--bg-panel-light)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    fontFamily: "var(--mono)",
    fontSize: "0.8rem",
    outline: "none",
  };

  const labelStyle = {
    fontFamily: "var(--mono)",
    fontSize: "0.65rem",
    color: "var(--text-tertiary)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "6px",
    display: "block",
  };

  const getStockColor = (stock) => {
    if (stock > 100) return "var(--accent-green)";
    if (stock > 30) return "var(--text-secondary)";
    return "var(--accent-red)";
  };

  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 4, md: 8 }, color: "var(--text-primary)" }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 3, mb: 5 }}>
          <Box>
            <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.65rem", color: "var(--text-tertiary)", letterSpacing: "0.3em", mb: 1, textTransform: "uppercase" }}>
              Admin Panel
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 300, letterSpacing: "-0.05em", display: "flex", alignItems: "center" }}>
              Product_Catalog<span className="blink" style={{ color: "var(--text-tertiary)", marginLeft: "4px" }}>_</span>
            </Typography>
          </Box>
          <Button onClick={openAdd} sx={{ bgcolor: "var(--text-primary)", color: "var(--bg-base)", borderRadius: 0, px: 3, py: 1.5, fontFamily: "var(--mono)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 1, "&:hover": { bgcolor: "var(--text-secondary)" } }}>
            <Plus size={16} />
            Add Product
          </Button>
        </Box>

        {status.error && (
          <Box sx={{ mb: 3, p: 2, border: "1px solid var(--accent-red)", color: "var(--accent-red)", fontFamily: "var(--mono)", fontSize: "0.75rem" }}>
            &gt; {status.error}
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, mb: 4, flexDirection: { xs: "column", md: "row" } }}>
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5, border: "1px solid var(--border)", bgcolor: "var(--bg-panel)", px: 2, py: 1.5 }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: "0.8rem" }} />
          </Box>
          <Button onClick={() => setShowFilters(!showFilters)} sx={{ border: "1px solid var(--border)", borderRadius: 0, px: 3, py: 1.5, fontFamily: "var(--mono)", fontSize: "0.75rem", letterSpacing: "0.1em", color: showFilters ? "var(--bg-base)" : "var(--text-secondary)", bgcolor: showFilters ? "var(--text-primary)" : "transparent", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 1 }}>
            <SlidersHorizontal size={14} />
            Filters
          </Button>
        </Box>

        {showFilters && (
          <Box sx={{ display: "flex", gap: 1, mb: 4, flexWrap: "wrap", p: 3, border: "1px solid var(--border)", bgcolor: "var(--bg-panel)" }}>
            {categories.map((cat) => (
              <Box key={cat} onClick={() => { setActiveCategory(cat); setCurrentPage(1); }} sx={{ px: 2, py: 0.8, border: "1px solid", borderColor: activeCategory === cat ? "var(--text-primary)" : "var(--border)", bgcolor: activeCategory === cat ? "var(--text-primary)" : "transparent", color: activeCategory === cat ? "var(--bg-base)" : "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: "0.65rem", cursor: "pointer", textTransform: "uppercase" }}>
                {cat}
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ border: "1px solid var(--border)", bgcolor: "var(--bg-panel)", overflow: "hidden" }}>
          <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "2fr 1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr", gap: 2, px: 3, py: 2, borderBottom: "1px solid var(--border)", bgcolor: "var(--bg-panel-light)", color: "var(--text-tertiary)" }}>
            {["Product Name", "Brand", "Category", "Price", "Rating", "Stock", "Actions"].map((h) => (
              <Typography key={h} sx={{ fontFamily: "var(--mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: h === "Actions" ? "right" : "left" }}>
                {h}
              </Typography>
            ))}
          </Box>

          {status.loading ? (
            <Box sx={{ p: 6, textAlign: "center", fontFamily: "var(--mono)", color: "var(--text-tertiary)" }}>&gt; LOADING_PRODUCTS</Box>
          ) : paginated.length === 0 ? (
            <Box sx={{ p: 6, textAlign: "center", fontFamily: "var(--mono)", color: "var(--text-tertiary)" }}>&gt; NO_RECORDS_FOUND</Box>
          ) : (
            paginated.map((product, index) => (
              <Box key={product._id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr" }, gap: 2, px: 3, py: 2.5, borderBottom: index < paginated.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}>
                <Box>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>{product.productName}</Typography>
                  <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-tertiary)", mt: 0.5, display: { xs: "block", md: "none" } }}>
                    {product.brand} · {product.category} · ₹{product.price}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: { xs: "none", md: "block" } }}>{product.brand}</Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: { xs: "none", md: "block" } }}>{product.category}</Typography>
                <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.875rem", display: { xs: "none", md: "block" } }}>₹{product.price}</Typography>
                <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
                  <Star size={12} color="var(--text-secondary)" fill="var(--text-secondary)" />
                  <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{product.rating}</Typography>
                </Box>
                <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.875rem", color: getStockColor(product.stock), fontWeight: 600, display: { xs: "none", md: "block" } }}>{product.stock}</Typography>
                <Box sx={{ display: "flex", gap: 1, justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                  <IconButton size="small" onClick={() => openEdit(product)} sx={{ border: "1px solid var(--border)", borderRadius: 0, width: 30, height: 30, color: "var(--text-secondary)" }}>
                    <Pencil size={14} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(product._id)} sx={{ border: "1px solid var(--border)", borderRadius: 0, width: 30, height: 30, color: "var(--text-secondary)", "&:hover": { bgcolor: "var(--accent-red)", color: "#fff" } }}>
                    <Trash2 size={14} />
                  </IconButton>
                </Box>
              </Box>
            ))
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mt: 4 }}>
          <IconButton size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} sx={{ border: "1px solid var(--border)", borderRadius: 0, width: 32, height: 32, color: "var(--text-secondary)" }}>
            <ChevronLeft size={14} />
          </IconButton>
          <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{currentPage} / {totalPages}</Typography>
          <IconButton size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} sx={{ border: "1px solid var(--border)", borderRadius: 0, width: 32, height: 32, color: "var(--text-secondary)" }}>
            <ChevronRight size={14} />
          </IconButton>
        </Box>
      </Container>

      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 0, color: "var(--text-primary)" } }}>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3, borderBottom: "1px solid var(--border)", bgcolor: "var(--bg-panel-light)" }}>
            <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {editingProduct ? "> Edit_Product" : "> Add_Product"}
            </Typography>
            <IconButton size="small" onClick={() => setShowAddModal(false)} sx={{ color: "var(--text-secondary)" }}>
              <X size={18} />
            </IconButton>
          </Box>
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <label style={labelStyle}>Product Name</label>
                <input style={inputStyle} value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} />
              </Box>
              <Box>
                <label style={labelStyle}>Brand</label>
                <input style={inputStyle} value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <label style={labelStyle}>Category</label>
                <input style={inputStyle} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
              </Box>
              <Box>
                <label style={labelStyle}>Stock</label>
                <input style={inputStyle} type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <label style={labelStyle}>Price (₹)</label>
                <input style={inputStyle} type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </Box>
              <Box>
                <label style={labelStyle}>Rating</label>
                <input style={inputStyle} type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 2, p: 3, borderTop: "1px solid var(--border)", justifyContent: "flex-end" }}>
            <Button onClick={() => setShowAddModal(false)} sx={{ border: "1px solid var(--border)", borderRadius: 0, px: 3, py: 1, fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Cancel</Button>
            <Button onClick={handleSubmit} sx={{ bgcolor: "var(--text-primary)", color: "var(--bg-base)", borderRadius: 0, px: 3, py: 1, fontFamily: "var(--mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>
              {editingProduct ? "> Save_Changes" : "> Add_Product"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
