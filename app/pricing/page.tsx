import PricingTable from "./_component/pricing-table";

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <PricingTable subscriptionDetails={null} />
    </div>
  );
}
