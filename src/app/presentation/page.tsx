import PresentationCinema from "@/components/PresentationCinema";

export const dynamic = "force-dynamic";

export default async function PresentationPage({
  searchParams,
}: {
  searchParams: Promise<{ slide?: string; url?: string }>;
}) {
  const params = await searchParams;
  const slide =
    params.slide === "architecture" || params.slide === "closing" ? params.slide : "problem";
  const liveUrl = params.url || process.env.NEXT_PUBLIC_LIVE_URL || "https://pricelock.66.135.18.157.sslip.io";

  return <PresentationCinema initialSlide={slide} liveUrl={liveUrl} />;
}
