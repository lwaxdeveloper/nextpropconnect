import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy",
  description: "NextPropConnect SA Privacy Policy - How we protect your data",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          <div className="prose prose-gray max-w-none bg-white rounded-2xl p-8 shadow-sm">
            <p className="text-gray-500 mb-6">Last updated: February 2026</p>

            <h2>1. Introduction</h2>
            <p>
              NextPropConnect SA (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated by iTedia (Pty) Ltd, 
              is committed to protecting your personal information in compliance with the 
              Protection of Personal Information Act 4 of 2013 (POPIA).
            </p>

            <h2>2. Information We Collect</h2>
            <p>We collect the following types of personal information:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email, phone number, password (encrypted)</li>
              <li><strong>Property Information:</strong> Property details, photos, addresses you list</li>
              <li><strong>Usage Data:</strong> How you interact with our platform</li>
              <li><strong>Payment Information:</strong> Processed securely via Ozow (we don&apos;t store card details)</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To provide and improve our property listing services</li>
              <li>To facilitate communication between buyers, sellers, and agents</li>
              <li>To process payments and subscriptions</li>
              <li>To send service-related notifications</li>
              <li>To comply with legal obligations</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul>
              <li>Other users (e.g., your contact info when you list a property)</li>
              <li>Payment processors (Ozow) to complete transactions</li>
              <li>Service providers who help operate our platform</li>
              <li>Law enforcement when required by law</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul>
              <li>SSL/TLS encryption for all data transmission</li>
              <li>Encrypted password storage</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
            </ul>

            <h2>6. Your Rights Under POPIA</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2>7. Cookies</h2>
            <p>
              We use essential cookies for authentication and site functionality. 
              No tracking cookies are used without your consent.
            </p>

            <h2>8. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide services. 
              You can request deletion at any time by contacting us.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              For privacy-related queries or to exercise your rights:
            </p>
            <ul>
              <li>Email: privacy@nextpropconnect.co.za</li>
              <li>Address: Boksburg, Gauteng, South Africa</li>
            </ul>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of significant 
              changes via email or through our platform.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
