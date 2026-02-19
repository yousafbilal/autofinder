import React, { useState } from 'react';
import { Helmet } from 'react-helmet';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How do I search for a car?',
      answer: 'You can search for cars using our search filters. Select the brand, model, budget, and other preferences to find the perfect car for you.'
    },
    {
      question: 'Can I compare different cars?',
      answer: 'Yes, you can compare up to 3 cars side by side. Just click on the compare button on any car detail page.'
    },
    {
      question: 'How do I contact a dealer?',
      answer: 'You can contact dealers directly through the car detail page. Click on the "Contact Dealer" button to get in touch.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including cash, bank transfer, and financing options. Contact the dealer for more details.'
    },
    {
      question: 'Do you offer car financing?',
      answer: 'Yes, many of our dealers offer financing options. Please contact them directly to discuss financing plans.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - Auto Finder</title>
      </Helmet>

      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-6 transition-colors">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Frequently Asked Questions</h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900 transition-colors">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${openIndex === index ? 'transform rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default FAQ;

