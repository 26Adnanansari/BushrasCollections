import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-6 -ml-4 hover:bg-transparent">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p>
            Welcome to Bushra's Collection. We respect your privacy and are committed to protecting your personal data. 
            This Privacy Policy will inform you about how we look after your personal data when you visit our website 
            and tell you about your privacy rights.
          </p>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Information We Collect</h2>
            <p>We may collect, use, store, and transfer different kinds of personal data about you, which we have grouped together as follows:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Identity Data:</strong> includes your first name, last name, and username (when you sign up via Google or Email).</li>
              <li><strong>Contact Data:</strong> includes your billing address, delivery address, email address, and telephone numbers.</li>
              <li><strong>Transaction Data:</strong> includes details about payments to and from you and other details of products you have purchased from us.</li>
              <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type, and version.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>To register you as a new customer and manage your account.</li>
              <li>To process and deliver your orders, including managing payments, fees, and charges.</li>
              <li>To communicate with you about your orders, support requests, and updates.</li>
              <li>To improve our website, products/services, marketing, and customer experiences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Data Sharing and Third Parties</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties 
              except for trusted third parties who assist us in operating our website, conducting our business, 
              or servicing you (such as payment gateways, database hosting like Supabase, and courier services for delivery). 
              These parties agree to keep this information confidential.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
              used, or accessed in an unauthorized way, altered, or disclosed. Your passwords and sensitive information 
              are securely encrypted and stored.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Your Legal Rights</h2>
            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Request access to your personal data.</li>
              <li>Request correction of your personal data.</li>
              <li>Request erasure of your personal data (Account deletion).</li>
            </ul>
            <p className="mt-4">
              If you wish to exercise any of the rights set out above, or have any questions about this Privacy Policy, 
              please contact our support team.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Changes to this Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
