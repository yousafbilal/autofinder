import React from 'react';
import { Helmet } from 'react-helmet';

function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Auto Finder</title>
        <meta name="description" content="Auto Finder Privacy Policy. Learn how we collect, use, and protect your personal information." />
      </Helmet>
      <div className="bg-white dark:bg-gray-900 min-h-screen transition-colors">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
              Privacy Policy
            </h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 space-y-8">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <strong className="text-gray-800 dark:text-gray-200">Last Updated:</strong> {new Date().toLocaleDateString()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Auto Finder ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect,
                  use, disclose, and safeguard your information when you use our website and services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  1. Information We Collect
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>
                    <strong className="text-gray-800 dark:text-gray-200">Personal Information:</strong> We collect information that you provide
                    directly to us, including your name, email address, phone number, and profile information when you create an account or post an ad.
                  </p>
                  <p>
                    <strong className="text-gray-800 dark:text-gray-200">Ad Information:</strong> When you post an ad, we collect information about
                    the vehicle including make, model, year, price, images, and description.
                  </p>
                  <p>
                    <strong className="text-gray-800 dark:text-gray-200">Payment Information:</strong> For premium ads and packages, we collect
                    payment receipt information for verification purposes. We do not store full payment details.
                  </p>
                  <p>
                    <strong className="text-gray-800 dark:text-gray-200">Usage Data:</strong> We automatically collect information about how you
                    interact with our website, including IP address, browser type, pages visited, and time spent on pages.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  2. How We Use Your Information
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>To provide, maintain, and improve our services</li>
                  <li>To process your ad postings and manage your account</li>
                  <li>To verify payments and process premium ad approvals</li>
                  <li>To communicate with you about your account, ads, and our services</li>
                  <li>To send you updates, newsletters, and promotional materials (with your consent)</li>
                  <li>To respond to your inquiries and provide customer support</li>
                  <li>To detect, prevent, and address technical issues and fraudulent activities</li>
                  <li>To comply with legal obligations and enforce our terms of service</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  3. Information Sharing and Disclosure
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>
                    We do not sell your personal information. We may share your information in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong className="text-gray-800 dark:text-gray-200">Public Ad Information:</strong> Information you include in your ads
                      (vehicle details, images, contact information) will be visible to all users of our platform.
                    </li>
                    <li>
                      <strong className="text-gray-800 dark:text-gray-200">Service Providers:</strong> We may share information with third-party
                      service providers who assist us in operating our website and conducting our business.
                    </li>
                    <li>
                      <strong className="text-gray-800 dark:text-gray-200">Legal Requirements:</strong> We may disclose information if required by
                      law or in response to valid requests by public authorities.
                    </li>
                    <li>
                      <strong className="text-gray-800 dark:text-gray-200">Business Transfers:</strong> In the event of a merger, acquisition, or
                      sale of assets, your information may be transferred to the acquiring entity.
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  4. Data Security
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We implement appropriate technical and organizational security measures to protect your personal information against unauthorized
                  access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is
                  100% secure, and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  5. Your Rights and Choices
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Access and update your personal information through your account settings</li>
                    <li>Delete your account and associated data</li>
                    <li>Edit or delete your posted ads</li>
                    <li>Opt-out of promotional communications by unsubscribing from our emails</li>
                    <li>Request a copy of your personal data</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  6. Cookies and Tracking Technologies
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct
                  your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not
                  be able to use some portions of our service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  7. Third-Party Links
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these
                  external sites. We encourage you to review the privacy policies of any third-party sites you visit.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  8. Children's Privacy
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
                  If you believe we have collected information from a child, please contact us immediately.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  9. Changes to This Privacy Policy
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page
                  and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  10. Contact Us
                </h2>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p>If you have any questions about this Privacy Policy, please contact us:</p>
                  <p>
                    <strong className="text-gray-800 dark:text-gray-200">Email:</strong>{' '}
                    <a href="mailto:autofinder786@gmail.com" className="text-red-600 dark:text-red-400 hover:underline">
                      autofinder786@gmail.com
                    </a>
                  </p>
                  <p>
                    <strong className="text-gray-800 dark:text-gray-200">Phone:</strong>{' '}
                    <a href="tel:+923348400943" className="text-red-600 dark:text-red-400 hover:underline">
                      +92 334 8400943
                    </a>
                  </p>
                  <p>
                    <strong className="text-gray-800 dark:text-gray-200">Address:</strong> G9 Markaz, Islamabad, Pakistan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPolicy;

