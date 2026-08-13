import { fetchCategories } from "@/lib/api";
import LandingClient from "@/components/home/LandingClient";

export const revalidate = 0; // Dynamic data loading

export default async function Home() {
  const categories = await fetchCategories(false);

  return <LandingClient categories={categories} />;
}

