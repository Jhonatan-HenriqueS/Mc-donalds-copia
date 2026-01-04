import { Suspense } from "react";

import CreateRestaurantClient from "./CreateRestaurantClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CreateRestaurantClient />
    </Suspense>
  );
}
