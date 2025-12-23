"use client";

import { WhistleBlowerDemo } from "@/components/WhistleBlowerDemo";

export default function DecryptPage() {
  return (
    <main className="mt-6 px-3 md:px-0">
      <WhistleBlowerDemo mode="decryptOnly" />
    </main>
  );
}
