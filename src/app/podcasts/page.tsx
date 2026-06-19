import { PodcastsClient } from "@/components/podcasts/PodcastsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podcasts | MedOneX Audio Library",
  description: "Listen to professional medical lectures and discussions on the go with the MedOneX Audio Hub.",
};

export default function PodcastsPage() {
  return <PodcastsClient />;
}
