import express from "express";

import {
    createInventory,
    getInventory,
    getInventoryById,
    updateInventory,
    deleteInventory,
} from "../controllers/inventoryController.js";


const router= express.Router();

// Route: /api/inventory
// Handles creating initial stock and fetching the complete stock catalog
router.route("/")
    .post(createInventory)
    .get(getInventory);

// Route: /api/inventory/:id
// Handles fetching, modifying, or removing a specific product's inventory tracking row
router.route("/:id")
    .get(getInventoryById)
    .put(updateInventory)
    .delete(deleteInventory);

export default router;










//extras 
// express is the foundation. It provides the tools to build the "rooms" (routes) and "security guards" (middleware).

