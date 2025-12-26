"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ProductsIdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    // If it's an image file extension, it's an old image path - return 404
    if (id && /\.(jpeg|jpg|png|gif|webp)$/i.test(id)) {
      // This is an old image path, not a product ID
      // Return 404 or redirect to home
      router.replace('/');
      return;
    }

    // Otherwise, redirect to the correct product route
    if (id) {
      router.replace(`/product/${id}`);
    } else {
      router.replace('/');
    }
  }, [id, router]);

  return null; // Or a loading spinner
}

