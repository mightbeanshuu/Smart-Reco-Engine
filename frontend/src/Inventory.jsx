import { useEffect, useMemo, useState } from "react";
import { Box, Typography, IconButton, Container } from "@mui/material";
import { Plus, Minus, AlertTriangle, PackageCheck, BarChart3, ArrowUpDown } from "lucide-react";
import { api } from "./api";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [status, setStatus] = useState({ loading: true, error: "" });

  const loadInventory = async () => {
    try {
      setInventory(await api.listInventory());
    } catch (error) {
      setStatus({ loading: false, error: error.message });
      return;
    }
    setStatus({ loading: false, error: "" });
  };

  useEffect(() => {
    let isMounted = true;

    // Initial load keeps stock state synced with MongoDB records.
    api.listInventory()
      .then((rows) => {
        if (!isMounted) return;
        setInventory(rows);
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

  const rows = useMemo(
    () =>
      inventory.map((item) => ({
        id: item._id,
        name: item.productId?.productName || "Unknown product",
        category: item.productId?.category || "-",
        stock: item.availableQuantity,
        threshold: 50,
        price: item.productId?.price || 0,
      })),
    [inventory]
  );

  const adjustStock = async (id, currentStock, delta) => {
    const availableQuantity = Math.max(0, currentStock + delta);
    try {
      await api.updateInventory(id, { availableQuantity });
      await loadInventory();
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sorted = [...rows].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === "string") return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return sortAsc ? valA - valB : valB - valA;
  });

  const totalItems = rows.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = rows.filter((item) => item.stock <= item.threshold).length;
  const totalValue = rows.reduce((sum, item) => sum + item.stock * item.price, 0);

  const getStockStatus = (item) => {
    if (item.stock === 0) return { label: "DEPLETED", color: "var(--accent-red)" };
    if (item.stock <= item.threshold) return { label: "BELOW_THRESHOLD", color: "var(--accent-red)" };
    if (item.stock <= item.threshold * 1.5) return { label: "WARNING", color: "#f59e0b" };
    return { label: "NOMINAL", color: "var(--accent-green)" };
  };

  const renderStockBar = (item) => {
    const max = item.threshold * 3;
    const percent = Math.min(100, (item.stock / max) * 100);
    const statusInfo = getStockStatus(item);
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
        <Box sx={{ flex: 1, height: 4, bgcolor: "var(--bg-panel-light)", position: "relative" }}>
          <Box sx={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${percent}%`, bgcolor: statusInfo.color, transition: "width 0.3s" }} />
          <Box sx={{ position: "absolute", left: `${Math.min(100, (item.threshold / max) * 100)}%`, top: -2, height: 8, width: 1, bgcolor: "var(--text-tertiary)", opacity: 0.5 }} />
        </Box>
        <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: statusInfo.color, minWidth: 80, textAlign: "right" }}>
          {statusInfo.label}
        </Typography>
      </Box>
    );
  };

  const renderSortHeader = (field, label, align) => (
    <Box onClick={() => handleSort(field)} sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", justifyContent: align === "right" ? "flex-end" : "flex-start", "&:hover": { color: "var(--text-primary)" } }}>
      <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "inherit" }}>{label}</Typography>
      <ArrowUpDown size={10} style={{ opacity: sortField === field ? 1 : 0.3 }} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 4, md: 8 }, color: "var(--text-primary)" }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, maxWidth: 600 }}>
          <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.65rem", color: "var(--text-tertiary)", letterSpacing: "0.3em", mb: 1, textTransform: "uppercase" }}>
            System Monitor
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 300, letterSpacing: "-0.05em", mb: 2, display: "flex", alignItems: "center" }}>
            Inventory_Control<span className="blink" style={{ color: "var(--text-tertiary)", marginLeft: "4px" }}>_</span>
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 300, lineHeight: 1.6 }}>
            Live stock records from the backend inventory API.
          </Typography>
        </Box>

        {status.error && (
          <Box sx={{ mb: 3, p: 2, border: "1px solid var(--accent-red)", color: "var(--accent-red)", fontFamily: "var(--mono)", fontSize: "0.75rem" }}>
            &gt; {status.error}
          </Box>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2, mb: 5 }}>
          {[
            { label: "TOTAL_UNITS", value: totalItems.toLocaleString(), icon: <PackageCheck size={16} />, color: "var(--text-primary)" },
            { label: "ALERTS_ACTIVE", value: lowStockCount, icon: <AlertTriangle size={16} />, color: lowStockCount > 0 ? "var(--accent-red)" : "var(--accent-green)" },
            { label: "INVENTORY_VALUE", value: `₹${totalValue.toLocaleString()}`, icon: <BarChart3 size={16} />, color: "var(--text-primary)" },
          ].map((stat) => (
            <Box key={stat.label} className="hud-box hud-box-tl hud-box-tr hud-box-bl hud-box-br" sx={{ border: "1px solid var(--border)", bgcolor: "var(--bg-panel)", p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "var(--text-tertiary)" }}>
                {stat.icon}
                <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>{stat.label}</Typography>
              </Box>
              <Typography sx={{ fontFamily: "var(--mono)", fontSize: "1.5rem", fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ border: "1px solid var(--border)", bgcolor: "var(--bg-panel)", overflow: "hidden" }}>
          <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "1.4fr 120px 100px 1.2fr 120px", gap: 2, px: 3, py: 2, borderBottom: "1px solid var(--border)", bgcolor: "var(--bg-panel-light)", color: "var(--text-tertiary)" }}>
            {renderSortHeader("name", "Product")}
            {renderSortHeader("category", "Category")}
            {renderSortHeader("stock", "Stock", "right")}
            <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>STATUS</Typography>
            <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textAlign: "right" }}>ACTIONS</Typography>
          </Box>

          {status.loading ? (
            <Box sx={{ p: 6, textAlign: "center", fontFamily: "var(--mono)", color: "var(--text-tertiary)" }}>&gt; LOADING_INVENTORY</Box>
          ) : sorted.length === 0 ? (
            <Box sx={{ p: 6, textAlign: "center", fontFamily: "var(--mono)", color: "var(--text-tertiary)" }}>&gt; NO_INVENTORY_RECORDS</Box>
          ) : (
            sorted.map((item, index) => {
              const statusInfo = getStockStatus(item);
              return (
                <Box key={item.id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr 120px 100px 1.2fr 120px" }, gap: 2, px: 3, py: 2, borderBottom: index < sorted.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>{item.name}</Typography>
                    <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-tertiary)", mt: 0.5, display: { xs: "block", md: "none" } }}>{item.category}</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.7rem", color: "var(--text-secondary)", display: { xs: "none", md: "block" } }}>{item.category}</Typography>
                  <Typography sx={{ fontFamily: "var(--mono)", fontSize: "0.95rem", fontWeight: 700, textAlign: { md: "right" }, color: statusInfo.color }}>{item.stock}</Typography>
                  <Box sx={{ display: { xs: "none", md: "block" } }}>{renderStockBar(item)}</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: { md: "flex-end" } }}>
                    <IconButton size="small" onClick={() => adjustStock(item.id, item.stock, -10)} sx={{ border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 0, width: 28, height: 28 }}>
                      <Minus size={12} />
                    </IconButton>
                    <IconButton size="small" onClick={() => adjustStock(item.id, item.stock, 10)} sx={{ border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 0, width: 28, height: 28 }}>
                      <Plus size={12} />
                    </IconButton>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Container>
    </Box>
  );
}
