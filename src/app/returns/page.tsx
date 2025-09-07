'use client';

import Navigation from '@/components/Navigation';

export default function ReturnsAndFAQPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16">
        <div className="prose prose-lg prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-white mb-8">Returns & FAQ</h1>
          
          <p>
            We want to make sure you love our products, and quality is guaranteed. If there is a print error or visible quality issue, we'll replace or refund it. For any quality issues, be sure to provide clear photos of the products on a flat, well-lit surface and include this in your email to us at <a href="mailto:support@loka.media" className="text-blue-400 hover:text-blue-300">support@loka.media</a>. This quick and simple step will help us provide a speedy resolution.
          </p>

          <p className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg">
            <strong>Because products are made to order, we do not accept general returns or sizing-related returns.</strong>
          </p>

          <p>Please read below for more details:</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Cancellations</h2>
          
          <h3 className="text-xl font-semibold text-white mt-6 mb-3">Product Orders Cancellation Policy</h3>
          <p>
            All of our products are made to order, especially for you. If you wish to cancel or amend your order, please contact us as soon as possible at <a href="mailto:support@loka.media" className="text-blue-400 hover:text-blue-300">support@loka.media</a>. You can edit your order at any time before it goes to production.
          </p>

          <p>
            Once your order has gone to production, you may be eligible for a replacement/resolution, depending on the situation. After you've received your order, you have 30 days to address any quality issues.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Damaged/Quality Issues</h2>
          
          <p>
            For the fastest resolution, please include a photograph demonstrating the quality issue of the print or the damaged area of the item, along with your order number. The most optimal pictures are on a flat surface, with the tag and error clearly displayed.
          </p>

          <p>
            Please email us with these details at <a href="mailto:support@loka.media" className="text-blue-400 hover:text-blue-300">support@loka.media</a>
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Refunds Policies</h2>
          
          <h3 className="text-xl font-semibold text-white mt-6 mb-3">Product Orders Refund Policy</h3>
          <p>
            Because products are made to order, we cannot issue refunds, returns, or exchanges for orders except for those with quality issues. Orders are non-refundable unless they meet these requirements and you provide support with a photograph demonstrating the quality issue.
          </p>

          <ul>
            <li><strong>PayPal:</strong> Any refunds processed will show back up in your PayPal account balance within 24 business hours.</li>
            <li><strong>Credit Card:</strong> Any refunds processed via your credit/debit card will show back up in your bank account within 7 to 10 business days, depending on your bank.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Accepted Payment Methods</h2>
          
          <p>
            We accept payments via credit/debit cards, PayPal, Google Pay, Apple Pay, and depending on your location, we also accept Klarna/AfterPay and local payment methods.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">International Orders</h2>
          
          <p>
            International orders may be subject to import taxes, duties, and other customs charges. The charges vary by country, and at this time, we are unable to calculate them in advance. For more information regarding your country's customs policies, please contact your local customs office. If such a fee indeed gets imposed on your package, you are responsible for its payment.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Shipping and Delivery</h2>
          
          <p>
            All products are printed and shipped by our fulfillment partners. Standard shipping times vary by location:
          </p>

          <ul>
            <li><strong>United States:</strong> 3-7 business days</li>
            <li><strong>Europe:</strong> 5-10 business days</li>
            <li><strong>Other International:</strong> 7-15 business days</li>
          </ul>

          <p>
            Shipping costs are calculated at checkout based on your location and order size. Express shipping options may be available for an additional fee.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Frequently Asked Questions</h2>
          
          <h3 className="text-xl font-semibold text-white mt-6 mb-3">How do I track my order?</h3>
          <p>
            Once your order ships, you'll receive a tracking number via email. You can use this to track your package on the carrier's website.
          </p>

          <h3 className="text-xl font-semibold text-white mt-6 mb-3">What if my package is lost or stolen?</h3>
          <p>
            Please contact us immediately at <a href="mailto:support@loka.media" className="text-blue-400 hover:text-blue-300">support@loka.media</a> if you believe your package was lost or stolen. We'll work with you to resolve the issue.
          </p>

          <h3 className="text-xl font-semibold text-white mt-6 mb-3">Can I change my shipping address after placing an order?</h3>
          <p>
            Address changes may be possible if the order hasn't gone into production yet. Contact us as soon as possible at <a href="mailto:support@loka.media" className="text-blue-400 hover:text-blue-300">support@loka.media</a> with your order number and new address.
          </p>

          <h3 className="text-xl font-semibold text-white mt-6 mb-3">What materials are used for your products?</h3>
          <p>
            We use high-quality materials sourced from our fulfillment partners. Specific material information is available on each product page. Common materials include:
          </p>
          <ul>
            <li>100% cotton for most apparel</li>
            <li>Cotton/polyester blends for certain items</li>
            <li>Premium paper stocks for prints</li>
            <li>Durable materials for accessories</li>
          </ul>

          <h3 className="text-xl font-semibold text-white mt-6 mb-3">How do I become a creator on Loka?</h3>
          <p>
            Visit our <a href="/auth/register" className="text-blue-400 hover:text-blue-300">creator signup page</a> and submit an application. Our team reviews all applications and will contact you with next steps if approved.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Contact Us</h2>
          
          <p>
            If you have any questions not covered in this FAQ, please don't hesitate to reach out:
          </p>

          <ul>
            <li><strong>Email:</strong> <a href="mailto:support@loka.media" className="text-blue-400 hover:text-blue-300">support@loka.media</a></li>
            <li><strong>General Inquiries:</strong> <a href="mailto:hello@loka.media" className="text-blue-400 hover:text-blue-300">hello@loka.media</a></li>
          </ul>

          <p>
            We typically respond to all inquiries within 24 hours during business days.
          </p>
        </div>
      </div>
    </div>
  );
}