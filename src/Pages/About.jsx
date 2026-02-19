import React from 'react';
import { Helmet } from 'react-helmet';

function About() {
  return (
    <>
      <Helmet>
        <title>About Us - Auto Finder</title>
      </Helmet>

      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-6 transition-colors">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">About Us</h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900 p-6 mb-6 transition-colors">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Welcome to Auto Finder</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg leading-relaxed">
              Autofinder is a complete automotive platform designed to make buying, selling, renting, and inspecting vehicles easier, faster, and more reliable. Our goal is to provide users with a transparent and hassle-free car experience by offering a range of professional services in one place.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We understand that buying or selling a car can be a complex process. That's why we've created a comprehensive platform that brings together all the tools and services you need. Whether you're looking to purchase your dream car, sell your current vehicle, rent a car for a special occasion, or get a professional vehicle inspection, Auto Finder is here to help.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Our commitment to transparency, reliability, and customer satisfaction sets us apart. We believe that everyone deserves a smooth and stress-free automotive experience, and we're dedicated to making that a reality for all our users.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Our Mission', desc: 'To make buying, selling, renting, and inspecting vehicles easier, faster, and more reliable for everyone.' },
              { title: 'Our Vision', desc: 'To be the leading complete automotive platform that provides transparent and hassle-free car experiences.' },
              { title: 'Our Values', desc: 'Transparency, reliability, customer satisfaction, and providing professional services in one convenient place.' }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900 p-6 hover:shadow-lg transition-all">
                <h3 className="text-xl font-semibold mb-3 text-red-600 dark:text-red-500">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default About;

