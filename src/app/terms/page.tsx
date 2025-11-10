'use client';

import Navigation from '@/components/Navigation';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last Updated: July 7, 2025</p>

          <p>
            Welcome, and thank you for your interest in Loka Store ("Loka," "we," or "us") and our website at https://store.loka.media (the "Service"). These Terms of Service are a legally binding contract between you and Loka regarding your use of the Service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">PLEASE READ THE FOLLOWING TERMS CAREFULLY</h2>

          <p className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <strong>BY CLICKING "I ACCEPT," OR BY OTHERWISE ACCESSING OR USING THE SERVICE, YOU AGREE THAT YOU HAVE READ AND UNDERSTOOD, AND, AS A CONDITION TO YOUR USE OF THE SERVICE, YOU AGREE TO BE BOUND BY, THE FOLLOWING TERMS AND CONDITIONS, INCLUDING LOKA MEDIA'S PRIVACY POLICY (TOGETHER, THESE "TERMS"). IF YOU ARE NOT ELIGIBLE, OR DO NOT AGREE TO THE TERMS, THEN YOU DO NOT HAVE OUR PERMISSION TO USE THE SERVICE.</strong>
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Loka Service Overview</h2>
          
          <p>We offer a creative marketplace platform where:</p>
          <ul>
            <li>Creators can design and sell custom merchandise using our design tools</li>
            <li>Customers can browse and purchase unique creator-designed products</li>
            <li>We provide design tools, canvas editors, and product customization features</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Eligibility</h2>

          <p>
            You must be at least 13 years old to use the Service. By agreeing to these Terms, you represent and warrant to us that: (a) you are at least 13 years old; (b) you have not previously been suspended or removed from the Service; and (c) your registration and your use of the Service is in compliance with any and all applicable laws and regulations.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Accounts and Registration</h2>

          <p>
            To access creator features or make purchases, you may need to register for an account. When you register for an account, you may be required to provide us with some information about yourself, such as your name, email address, or other contact information. You agree that the information you provide to us is accurate and that you will keep it accurate and up-to-date at all times.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Creator Accounts</h2>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Creator Application Process</h3>
          <p>
            To become a creator on our platform, you must apply and be approved by our team. Creator applications are reviewed for quality, originality, and alignment with our platform values.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Creator Responsibilities</h3>
          <p>As a creator, you agree to:</p>
          <ul>
            <li>Create original designs or use properly licensed content</li>
            <li>Maintain high-quality standards for your products</li>
            <li>Respond to customer inquiries in a timely manner</li>
            <li>Comply with all applicable laws and platform policies</li>
            <li>Not infringe on intellectual property rights of others</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Creator Earnings</h3>
          <p>
            Creators earn a percentage of sales from their products. Earnings are calculated after platform fees, payment processing fees, and product costs. Payment schedules and minimum payout thresholds are outlined in the Creator Dashboard.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Payment Terms</h2>
          
          <p>
            Purchase of any Product through the Service may require you to pay fees. Before you pay any fees, you will have an opportunity to review and accept the fees that you will be charged. All fees are in U.S. Dollars.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Returns and Refunds</h2>

          <p>
            We will accept returns for defective Products made within 30 days of the purchase date. We will issue a full refund for defective products and will pay for return shipping if required. We do not accept returns for non-defective products due to their custom, made-to-order nature.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Prohibited Conduct</h2>
          
          <p>BY USING THE SERVICE YOU AGREE NOT TO:</p>
          <ul>
            <li>Use the Service for any illegal purpose or in violation of any applicable laws</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Upload offensive, harmful, or inappropriate content</li>
            <li>Interfere with the operation of the Service or other users' enjoyment</li>
            <li>Perform any fraudulent activity or impersonate others</li>
            <li>Violate our community guidelines or creator standards</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Intellectual Property</h2>

          <p>
            The Service is owned and operated by Loka. The visual interfaces, graphics, design, compilation, information, data, computer code, products, software, services, and all other elements of the Service are protected by intellectual property and other laws.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Disclaimers and Limitation of Liability</h2>

          <p className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</strong>
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Contact Information</h2>

          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:legal@loka.media" className="text-pink-500 hover:text-pink-600">legal@loka.media</a>.
          </p>
        </div>
      </div>
    </div>
  );
}