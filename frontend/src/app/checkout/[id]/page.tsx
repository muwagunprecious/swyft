"use client";

import dynamic from "next/dynamic";

const CheckoutForm = dynamic(() => import("../CheckoutForm"), {
  ssr: false,
});

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1a202c]">
      <CheckoutForm />
    </div>
  );
}
