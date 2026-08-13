import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCategoryBySlug } from "@/lib/api";
import ExperienceClient from "./ExperienceClient";

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await fetchCategoryBySlug(params.slug);

  if (!category) {
    return {
      title: "Environment Not Found — Nostalgic Moments",
      description: "The requested nostalgic music environment could not be found.",
    };
  }

  const title = `${category.name} — Nostalgic Music Experience`;
  const description =
    category.tagline ||
    category.description ||
    `Step inside ${category.name} and stream nostalgic Indian classics.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: category.thumbnail_url || category.background_url ? [{ url: category.thumbnail_url || category.background_url! }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ExperiencePage({ params }: Props) {
  const category = await fetchCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  return <ExperienceClient category={category} />;
}
