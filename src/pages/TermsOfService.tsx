import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-6 -ml-4 hover:bg-transparent">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Terms of Service</h1>
        
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p>
            Welcome to Bushra's Collection. These Terms of Service ("Terms") govern your access to and use of our website, 
            products, and services. By accessing or using our platform, you agree to be bound by these Terms.
          </p>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By visiting our site and/or purchasing something from us, you engage in our "Service" and agree to be 
              bound by the following terms and conditions. If you do not agree to all the terms and conditions of this 
              agreement, then you may not access the website or use any services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. User Accounts & Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate, complete, and current information when creating an account.</li>
              <li>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</li>
              <li>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Products and Pricing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Product Accuracy:</strong> We have made every effort to display as accurately as possible the colors and images of our products. 
                However, we cannot guarantee that your computer monitor's display of any color will be completely accurate.
              </li>
              <li>
                <strong>Made to Order (MTO):</strong> Certain products are exclusively made to order and will require a specific timeframe for completion before dispatch.
              </li>
              <li>
                <strong>Pricing:</strong> Prices for our products are subject to change without notice. We reserve the right to modify or discontinue a product without notice at any time.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Payment and Shipping</h2>
            <p>
              We offer various payment methods including Cash on Delivery (COD) and Bank Transfers where applicable. 
              Orders are subject to verification and acceptance. Delivery timelines provided are estimates and delays 
              caused by third-party courier services are beyond our direct control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Intellectual Property</h2>
            <p>
              All content included on this site, such as text, graphics, logos, images, and software, is the property of 
              Bushra's Collection and is protected by international copyright laws. You may not reproduce, duplicate, copy, 
              sell, resell or exploit any portion of the Service without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Limitation of Liability</h2>
            <p>
              In no case shall Bushra's Collection, our directors, officers, employees, affiliates, or agents be liable 
              for any direct, indirect, incidental, punitive, or consequential damages arising from your use of any of 
              the service or any products procured using the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mt-8 mb-4">7. Contact Information</h2>
            <p>
              Questions about the Terms of Service should be sent to us via our Contact Us page or directly through our official support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
