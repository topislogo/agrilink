"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to homepage which shows all products
    router.push('/');
  }, [router]);
  
  return null;
}
