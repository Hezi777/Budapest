import { MapView } from "@/components/map-view";

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const { day } = await searchParams;
  return <MapView initialDay={typeof day === "string" ? day : undefined} />;
}
