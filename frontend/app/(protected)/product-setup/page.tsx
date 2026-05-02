"use client";

import DataTableContent from "@/components/Slice/UI/DataTableContent";
import ProductsTable from "./_components/ProductsTable";

export default function ProductSetupPage() {
  return (
    <DataTableContent
      title="Product setup"
      description="Create, search, and manage catalog products."
    >
      <ProductsTable />
    </DataTableContent>
  );
}
