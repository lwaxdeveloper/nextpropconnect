import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import Link from "next/link";
import { query } from "@/lib/db";

// Fetch featured properties
async function getFeaturedProperties() {
  try {
    const result = await query(`
      SELECT p.*, u.name as agent_name 
      FROM properties p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE p.status = 'active' 
      ORDER BY p.created_at DESC 
      LIMIT 6
    `);
    return result.rows;
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

export default async function Home() {
  const properties = await getFeaturedProperties();

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-22b4899975d6?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-40" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="font-heading font-bold text-4xl md:text-6xl text-white mb-6 drop-shadow-lg tracking-tight">
            Find your place in <span className="text-accent">South Africa</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md">
            The most trusted way to buy, sell, and rent property. From city apartments to township homes.
          </p>

          {/* Search Box */}
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="City, Suburb, or Area (e.g. Sandton)" 
                  className="w-full pl-10 h-12 text-base rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select className="h-12 w-full md:w-48 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Property Type</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="townhouse">Townhouse</option>
                <option value="land">Land</option>
              </select>
              <Link 
                href="/properties"
                className="h-12 px-8 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center hover:bg-primary/90 transition"
              >
                Search
              </Link>
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              <Link href="/properties?status=sale" className="text-sm text-muted-foreground hover:text-primary transition">
                Buy
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/properties?status=rent" className="text-sm text-muted-foreground hover:text-primary transition">
                Rent
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/properties/new" className="text-sm text-muted-foreground hover:text-primary transition">
                Sell
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-heading font-bold text-3xl text-foreground mb-2">Featured Properties</h2>
              <p className="text-muted-foreground">Handpicked homes just for you.</p>
            </div>
            <Link 
              href="/properties"
              className="hidden md:flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.length > 0 ? (
              properties.map((property: any) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
              // Placeholder cards when no properties
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm animate-pulse">
                  <div className="h-48 bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-6 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link 
              href="/properties"
              className="inline-block px-6 py-3 border border-input rounded-lg hover:bg-muted transition"
            >
              View All Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-6 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-heading font-bold text-xl mb-2">Verified Listings</h3>
              <p className="text-muted-foreground leading-relaxed">
                Say goodbye to scams. We verify ownership of every listing so you can browse with confidence.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-secondary/5 hover:bg-secondary/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-heading font-bold text-xl mb-2">Smart Valuation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Not sure what your home is worth? Get an instant, AI-powered valuation based on real market data.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-accent/5 hover:bg-accent/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-heading font-bold text-xl mb-2">Direct Chat</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect directly with agents and sellers. No more endless email chains—just quick, easy chat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">Ready to make a move?</h2>
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Whether you&apos;re selling your first home or renting your first apartment, we&apos;re here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/properties"
              className="px-8 py-4 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/90 transition text-lg"
            >
              Browse Properties
            </Link>
            <Link 
              href="/properties/new"
              className="px-8 py-4 bg-transparent border border-primary-foreground/30 text-primary-foreground font-semibold rounded-xl hover:bg-primary-foreground/10 transition text-lg"
            >
              List Your Property
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
