import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Import existing components to wrap in cards
// For this quick prototype, I'll mock the sections or just use simple text content 
// that represents the "Hero", "Search", "Services" etc. 
// Ideally, we import the actual components like <UnifiedCarSearch />

const SectionCard = ({ children, align = "left", delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: align === "left" ? -100 : 100, rotateY: align === "left" ? -15 : 15 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.8, delay, type: "spring" }}
            className={`w-[90%] md:w-[600px] bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl mb-[80vh] ${align === "left" ? "self-start ml-4 md:ml-20" : "self-end mr-4 md:mr-20"}`}
        >
            {children}
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
        </motion.div>
    );
};

const ContentOverlay = () => {
    return (
        <div className="relative z-10 flex flex-col pt-[100vh] pb-[50vh] min-h-screen pointer-events-none">
            {/* Allow pointer events only on the cards */}
            <div className="flex flex-col w-full max-w-7xl mx-auto pointer-events-auto gap-20">

                {/* Section 1: Hero / Intro */}
                <SectionCard align="left">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase italic">
                        The Future of <span className="text-red-600">Driving</span>
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Experience the next generation of automotive marketplace.
                        Find your dream car with AI-powered search.
                    </p>
                    <button className="mt-6 px-8 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition transform hover:scale-105">
                        Start Engine
                    </button>
                </SectionCard>

                {/* Section 2: Search */}
                <SectionCard align="right">
                    <h2 className="text-3xl font-bold text-white mb-4">Find Your Perfect Match</h2>
                    <div className="bg-black/50 p-4 rounded-lg">
                        {/* Placeholder for Search Component */}
                        <div className="flex gap-2">
                            <input type="text" placeholder="Search Cars..." className="w-full p-2 rounded bg-white/20 text-white placeholder-gray-400" />
                            <button className="p-2 bg-red-600 rounded text-white">Search</button>
                        </div>
                        <div className="flex gap-2 mt-4 text-xs text-gray-400">
                            <span>Popular:</span>
                            <span className="text-white">Toyota</span>
                            <span className="text-white">Honda</span>
                            <span className="text-white">Suzuki</span>
                        </div>
                    </div>
                </SectionCard>

                {/* Section 3: Services */}
                <SectionCard align="left">
                    <h2 className="text-3xl font-bold text-white mb-4">Premium Services</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition">
                            <h3 className="text-red-500 font-bold">Sell It For Me</h3>
                            <p className="text-xs text-gray-400">We handle the hassle.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition">
                            <h3 className="text-blue-500 font-bold">Car Inspection</h3>
                            <p className="text-xs text-gray-400">Certified reports.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition">
                            <h3 className="text-green-500 font-bold">Rent A Car</h3>
                            <p className="text-xs text-gray-400">Instant booking.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition">
                            <h3 className="text-yellow-500 font-bold">Auto Parts</h3>
                            <p className="text-xs text-gray-400">Genuine accessories.</p>
                        </div>
                    </div>
                </SectionCard>

                {/* Section 4: Latest Cars */}
                <SectionCard align="right">
                    <h2 className="text-3xl font-bold text-white mb-4">Latest Arrivals</h2>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="min-w-[150px] bg-black/40 p-2 rounded border border-white/10">
                                <div className="h-20 bg-gray-700 rounded mb-2"></div>
                                <div className="h-4 w-3/4 bg-gray-600 rounded mb-1"></div>
                                <div className="h-3 w-1/2 bg-gray-600 rounded"></div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

            </div>
        </div>
    );
};

export default ContentOverlay;
