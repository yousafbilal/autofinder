import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { server_ip } from '../Utils/Data';
import { toast } from 'react-toastify';
import { FaCar, FaMotorcycle, FaRocket } from 'react-icons/fa';

function DealerPackages() {
  const [activeTab, setActiveTab] = useState('car');
  const [carPackages, setCarPackages] = useState([]);
  const [bikePackages, setBikePackages] = useState([]);
  const [boosterPackages, setBoosterPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllPackages();
  }, []);

  const fetchAllPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = server_ip || 'http://localhost:8001';

      // Fetch car, bike, and booster packages in parallel
      const [carResponse, bikeResponse, boosterResponse] = await Promise.all([
        fetch(`${API_URL}/mobile/dealer_packages/car`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
          credentials: 'omit',
        }),
        fetch(`${API_URL}/mobile/dealer_packages/bike`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
          credentials: 'omit',
        }),
        fetch(`${API_URL}/mobile/dealer_packages/booster`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
          credentials: 'omit',
        }),
      ]);

      // Process car packages
      if (carResponse.ok) {
        const carData = await carResponse.json();
        let carPkgs = [];
        if (carData.success && Array.isArray(carData.packages)) {
          carPkgs = carData.packages;
        } else if (Array.isArray(carData)) {
          carPkgs = carData;
        }
        setCarPackages(carPkgs);
      }

      // Process bike packages
      if (bikeResponse.ok) {
        const bikeData = await bikeResponse.json();
        let bikePkgs = [];
        if (bikeData.success && Array.isArray(bikeData.packages)) {
          bikePkgs = bikeData.packages;
        } else if (Array.isArray(bikeData)) {
          bikePkgs = bikeData;
        }
        setBikePackages(bikePkgs);
      }

      // Process booster packages
      if (boosterResponse.ok) {
        const boosterData = await boosterResponse.json();
        let boosterPkgs = [];
        if (boosterData.success && Array.isArray(boosterData.packages)) {
          boosterPkgs = boosterData.packages;
        } else if (Array.isArray(boosterData)) {
          boosterPkgs = boosterData;
        }
        setBoosterPackages(boosterPkgs);
      }
    } catch (err) {
      console.error('❌ Error fetching packages:', err);
      setError('Failed to load packages. Please try again.');
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const currentPackages =
    activeTab === 'car' ? carPackages :
      activeTab === 'bike' ? bikePackages :
        boosterPackages;

  // Get gradient colors based on package type
  const getGradientColors = (type) => {
    if (type === 'car') return 'from-[#FF6B6B] to-[#FF8E53]';
    if (type === 'bike') return 'from-[#4ECDC4] to-[#44A08D]';
    return 'from-[#A8E6CF] to-[#88D8A3]';
  };

  // Get icon based on package type
  const getPackageIcon = (type) => {
    if (type === 'car') return <FaCar className="w-7 h-7" />;
    if (type === 'bike') return <FaMotorcycle className="w-7 h-7" />;
    return <FaRocket className="w-7 h-7" />;
  };

  return (
    <>
      <Helmet>
        <title>Dealer Packages - Auto Finder</title>
      </Helmet>

      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8 transition-colors">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Dealer Packages
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose the perfect package for your needs
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('car')}
              className={`px-6 py-3 font-semibold transition-colors relative ${activeTab === 'car'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              Car Packages
              {activeTab === 'car' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('bike')}
              className={`px-6 py-3 font-semibold transition-colors relative ${activeTab === 'bike'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              Bike Packages
              {activeTab === 'bike' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('booster')}
              className={`px-6 py-3 font-semibold transition-colors relative ${activeTab === 'booster'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              Booster Packages
              {activeTab === 'booster' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400"></span>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 mb-6 text-center">
              <p className="text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading packages...</p>
            </div>
          ) : currentPackages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No {activeTab === 'car' ? 'car' : activeTab === 'bike' ? 'bike' : 'booster'} packages available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentPackages.map((pkg) => {
                const packagePrice = pkg.discountedPrice || pkg.discountedRate || pkg.price || 0;
                const originalPrice = pkg.originalPrice || pkg.actualPrice || pkg.price || packagePrice;
                const youSaved = originalPrice - packagePrice;
                const savingsPercentage = originalPrice > 0 ? Math.round((youSaved / originalPrice) * 100) : 0;
                const isPopular = pkg.popular || false;
                const packageType = pkg.type || activeTab;
                const totalAds = activeTab === 'booster' ? 0 : (pkg.totalAds || 0);
                const validityDays = pkg.validityDays || pkg.noOfDays || pkg.liveAdDays || 0;
                const boosts = activeTab === 'booster' ? (pkg.freeBoosters || pkg.noOfBoosts || pkg.featuredListings || 0) : (pkg.freeBoosters || 0);

                return (
                  <div
                    key={pkg.id || pkg._id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg flex flex-col h-full max-w-sm mx-auto w-full"
                  >
                    {/* Gradient Header */}
                    <div className={`bg-gradient-to-br ${getGradientColors(packageType)} p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-white">
                            {getPackageIcon(packageType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-white break-words line-clamp-1">
                              {pkg.name || pkg.bundleName}
                            </h3>
                            {isPopular && (
                              <div className="flex items-center gap-1 mt-1 bg-white/30 px-2 py-0.5 rounded-full w-fit">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-[10px] font-semibold text-white">Popular</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {savingsPercentage > 0 && (
                          <div className="bg-white/25 border border-white/50 px-2.5 py-1 rounded-xl">
                            <span className="text-xs font-bold text-white">{savingsPercentage}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-2.5 flex flex-col flex-1">
                      {/* Price Section */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-baseline gap-2">
                          {originalPrice > packagePrice && (
                            <span className="text-sm font-medium text-gray-500 line-through">
                              PKR {originalPrice.toLocaleString()}
                            </span>
                          )}
                          <span className="text-xl font-bold text-red-600 dark:text-red-500">
                            PKR {packagePrice.toLocaleString()}
                          </span>
                        </div>
                        {youSaved > 0 && (
                          <div className="bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg">
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                              Save {youSaved.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Highlights - Icons in a row */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 mb-2 flex items-center justify-around">
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{totalAds}</span>
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">Ads</span>
                        </div>
                        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{validityDays}</span>
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">Days</span>
                        </div>
                        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{boosts}</span>
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">Boost</span>
                        </div>
                      </div>

                      {/* Features - Only show 2 features */}
                      {pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 flex-1">
                          {pkg.features.slice(0, 2).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md flex-1 min-w-[45%]">
                              <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">{feature}</span>
                            </div>
                          ))}
                          {pkg.features.length > 2 && (
                            <div className="text-xs text-red-600 dark:text-red-400 italic self-center">
                              +{pkg.features.length - 2} more
                            </div>
                          )}
                        </div>
                      )}

                      {/* View Package Button */}
                      <button
                        onClick={() => {
                          // Navigate to package detail page
                          const packageId = pkg.id || pkg._id;
                          window.location.href = `/package-detail/${packageId}`;
                        }}
                        className="w-full bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 mt-auto"
                      >
                        <span>View Package</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DealerPackages;

