import React from 'react';
import { Helmet } from 'react-helmet';

function Help() {
  return (
    <>
      <Helmet>
        <title>Help & Support - Auto Finder</title>
        <meta name="description" content="Get help and support for Auto Finder. Find answers to common questions, contact our support team, and learn how to use our platform." />
      </Helmet>
      <div className="bg-white dark:bg-gray-900 min-h-screen transition-colors">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
              Help & Support
            </h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                Frequently Asked Questions
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    How do I post an ad?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    To post an ad, click on "Post an Ad" in the header menu, then select "Sell Your Car" or "Sell Your Bike". 
                    Choose between a free ad or premium ad, fill in the required details, upload images, and submit your ad. 
                    Premium ads require payment verification and will be reviewed by our admin team.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    What is the difference between free and premium ads?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Free ads are posted immediately and are visible to all users. Premium ads offer enhanced visibility, 
                    featured placement, and priority in search results. Premium ads require payment verification and admin approval 
                    before going live.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    How do I edit or delete my ad?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Go to "My Ads" in your profile menu. You'll see all your posted ads with options to edit or delete them. 
                    Click on "Edit" to modify your ad details, or "Delete" to remove your ad permanently.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    What are dealer packages?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Dealer packages are subscription plans that allow you to post multiple ads and use boost features. 
                    Packages include a certain number of ads and boosters that you can use within the package validity period. 
                    You can purchase packages from the "Dealer Packages" section in the menu.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    How do I contact a seller?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    On any car or bike detail page, you'll find the seller's contact information including phone number and email. 
                    You can contact them directly using the provided contact details.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    How do I search for cars or bikes?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Use the search bar in the header or navigate to "Used Cars", "Latest Cars", "Used Bikes", or "New Bikes" sections. 
                    You can filter results by make, model, price range, city, body type, and other criteria using the filter options on the left sidebar.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    What payment methods are accepted?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    We accept payments through EasyPaisa and JazzCash. After selecting a package or premium ad, you'll be prompted 
                    to choose your payment method and upload a payment receipt for admin verification.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    How long does it take for my premium ad to be approved?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Premium ads typically go live within 24 hours after payment verification. Our admin team reviews all premium 
                    ads and payment receipts to ensure authenticity before approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                Contact Support
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Phone Support
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    <a href="tel:+923348400943" className="text-red-600 dark:text-red-400 hover:underline">
                      +92 334 8400943
                    </a> (24/7 Support Line)
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Email Support
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    <a href="mailto:autofinder786@gmail.com" className="text-red-600 dark:text-red-400 hover:underline">
                      autofinder786@gmail.com
                    </a>
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Office Address
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    G9 Markaz, Islamabad, Pakistan
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

export default Help;

