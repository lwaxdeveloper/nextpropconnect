import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service",
  description: "NextPropConnect SA Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          <div className="prose prose-gray max-w-none bg-white rounded-2xl p-8 shadow-sm">
            <p className="text-gray-500 mb-6">Last updated: February 2026</p>

            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using NextPropConnect SA (&quot;the Platform&quot;), operated by 
              iTedia (Pty) Ltd, you agree to be bound by these Terms of Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              NextPropConnect SA is a property listing platform that connects buyers, 
              sellers, landlords, tenants, and estate agents in South Africa.
            </p>

            <h2>3. User Accounts</h2>
            <ul>
              <li>You must provide accurate and complete information when registering</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 18 years old to use this service</li>
              <li>One person may not maintain multiple free accounts</li>
            </ul>

            <h2>4. Property Listings</h2>
            <ul>
              <li>You must have legal authority to list a property</li>
              <li>All listing information must be accurate and not misleading</li>
              <li>Photos must be of the actual property being listed</li>
              <li>We reserve the right to remove listings that violate our policies</li>
              <li>Fraudulent listings will result in immediate account termination</li>
            </ul>

            <h2>5. Subscriptions & Payments</h2>
            <ul>
              <li>Paid subscriptions are billed monthly</li>
              <li>Payments are processed securely via Ozow</li>
              <li>You may cancel your subscription at any time</li>
              <li>Refunds are provided on a case-by-case basis</li>
              <li>We may change pricing with 30 days notice</li>
            </ul>

            <h2>6. Free Trial</h2>
            <p>
              New users receive 90 days free access to all features. After the trial period, 
              you may continue with a free plan or upgrade to a paid subscription.
            </p>

            <h2>7. Prohibited Conduct</h2>
            <p>You may not:</p>
            <ul>
              <li>Post fraudulent, misleading, or illegal listings</li>
              <li>Harass, spam, or abuse other users</li>
              <li>Attempt to hack or disrupt the platform</li>
              <li>Scrape or collect data without permission</li>
              <li>Use the platform for money laundering or illegal activities</li>
            </ul>

            <h2>8. Limitation of Liability</h2>
            <p>
              NextPropConnect SA is a platform connecting parties. We do not:
            </p>
            <ul>
              <li>Guarantee the accuracy of listings</li>
              <li>Verify property ownership (unless using our verification service)</li>
              <li>Take responsibility for transactions between users</li>
              <li>Guarantee any specific outcomes</li>
            </ul>
            <p>
              Our liability is limited to the fees you have paid us in the past 12 months.
            </p>

            <h2>9. Intellectual Property</h2>
            <p>
              The Platform, including its design, code, and branding, is owned by iTedia (Pty) Ltd. 
              You retain ownership of content you post but grant us a license to display it.
            </p>

            <h2>10. Termination</h2>
            <p>
              We may suspend or terminate accounts that violate these terms. 
              You may delete your account at any time through your settings.
            </p>

            <h2>11. Dispute Resolution</h2>
            <p>
              Any disputes will be resolved under South African law in the courts of Gauteng.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We may update these terms. Continued use after changes constitutes acceptance.
            </p>

            <h2>13. Contact</h2>
            <p>
              Questions? Contact us at legal@nextpropconnect.co.za
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
