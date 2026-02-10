import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingForm from "@/components/ListingForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create Listing — NextPropConnect SA",
  description: "List your property on NextPropConnect SA. It takes 5 minutes.",
};

export default async function CreateListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen bg-light">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-dark">
              List Your Property
            </h1>
            <p className="text-gray-500 mt-1">
              Fill in the details below. You can save as draft and come back any time.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
            <ListingForm />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
