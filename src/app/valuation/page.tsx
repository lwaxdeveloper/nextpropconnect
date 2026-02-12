import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PropertyValuation } from "@/components/ai";

export const metadata = {
  title: "Property Valuation — NextPropConnect",
  description: "Get an AI-powered estimate of your property's market value",
};

export default function ValuationPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <section className="flex-1 py-12 bg-gradient-to-br from-primary/5 via-white to-purple-50">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark mb-2">Property Valuation Tool</h1>
            <p className="text-gray-600">
              Get an instant AI-powered estimate of your property&apos;s market value
            </p>
          </div>

          <PropertyValuation />

          <div className="mt-8 p-6 bg-white rounded-2xl shadow-sm border">
            <h2 className="font-semibold text-dark mb-3">How it works</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                Enter your property details (bedrooms, bathrooms, type)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                Add your location (suburb and city)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                Our AI analyzes similar properties in your area
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                Get an instant valuation range with confidence score
              </li>
            </ul>
          </div>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Need a professional valuation? Contact one of our{" "}
            <a href="/agents" className="text-primary hover:underline">
              verified agents
            </a>
            .
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
