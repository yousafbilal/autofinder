import { toast } from 'react-toastify';

/**
 * Semantic Voice Navigation Logic
 * 
 * Uses a keyword-scoring system to find the best matching route for a user's voice command.
 * Supports English, Urdu, and Roman Urdu.
 */

// 1. Define the Route Map with Keywords
const ROUTES_MAP = [
    // --- TOOLS & UTILITIES ---
    {
        name: 'Price Calculator',
        path: '/price-calculator',
        keywords: [
            'calculator', 'price', 'qimat', 'valuation', 'rate', 'worth', 'estimate', 'hisab', 'check price',
            'gari ki qimat', 'car price', 'pricecalculator', 'carvaluation', 'rates'
        ]
    },
    {
        name: 'Car Comparison',
        path: '/compare-cars',
        keywords: [
            'compare', 'muqabla', 'comparison', 'vs', 'versus', 'fark', 'difference', 'better',
            'konsi behtar', 'compare cars', 'comparison', 'comparecars'
        ]
    },
    {
        name: 'Videos & Reviews',
        path: '/videos',
        keywords: [
            'video', 'videos', 'review', 'youtube', 'watch', 'dekhna', 'test drive', 'walkaround',
            'car reviews', 'gari ki video', 'reviews'
        ]
    },
    {
        name: 'Car Inspection',
        path: '/inspection',
        keywords: [
            'inspection', 'checkup', 'check', 'moaina', 'report', 'rating', 'condition', 'mechanic',
            'check karwani', 'inspect', 'car check', 'inspections'
        ]
    },
    {
        name: 'Blog & News',
        path: '/blog',
        keywords: [
            'blog', 'blogs', 'news', 'khabrain', 'article', 'articles', 'updates', 'latest news', 'auto news', 'information',
            'knowledge', 'news page', 'blogpage'
        ]
    },

    // --- MARKETPLACE SECTIONS ---
    {
        name: 'Auto Store',
        path: '/auto-store',
        keywords: [
            'auto store', 'autostore', 'store', 'shop', 'dukan', 'parts', 'spare parts', 'spareparts', 'saman', 'accessories',
            'oil', 'filter', 'tyre', 'battery', 'brakes', 'lights', 'bumper', 'gari ka saman', 'autoshop'
        ]
    },
    {
        name: 'New Cars',
        path: '/latest-cars',
        keywords: [
            'new car', 'new cars', 'newcar', 'nayi gari', 'latest', 'upcoming', 'zero meter', 'brand new',
            'launch', '2024', '2025', 'new model', 'latestcars', 'gaddi', 'nayi gaddi', 'motar', 'new motar'
        ]
    },
    {
        name: 'Used Cars',
        path: '/used-cars',
        keywords: [
            'used car', 'used cars', 'usedcar', 'old car', 'purani gari', 'second hand', 'used', 'sasti',
            'budget', 'kam qimat', 'for sale', 'oldcar', 'purani gaddi', 'old motar'
        ]
    },
    {
        name: 'Bikes',
        path: '/bikes',
        keywords: [
            'bike', 'bikes', 'motorcycle', 'motor', 'cycle', 'honda 125', 'cd 70', 'yamaha',
            'scooter', '2 wheeler', 'do pahiya', 'motorcycles'
        ]
    },
    {
        name: 'New Bikes',
        path: '/new-bikes',
        keywords: [
            'new bike', 'nayi bike', 'new motorcycle', 'zero meter bike', 'newbike'
        ]
    },

    // --- BUYING & SELLING ---
    {
        name: 'Sell Car',
        path: '/sell-car',
        keywords: [
            'sell car', 'car bechni', 'gari bechni', 'sell my car', 'post ad', 'advertisement',
            'add lagana', 'sale', 'bechna', 'sellcar', 'gaddi vechni', 'motar kharts', 'gadi khapayo'
        ]
    },
    {
        name: 'Sell Bike',
        path: '/sell-bike',
        keywords: [
            'sell bike', 'bike bechni', 'motorcycle bechni', 'sellbike'
        ]
    },
    {
        name: 'Sell Parts',
        path: '/sell-car-parts',
        keywords: [
            'sell parts', 'parts bechnay', 'saman bechna', 'sellparts'
        ]
    },
    {
        name: 'Rent Car',
        path: '/rent-car',
        keywords: [
            'rent', 'rental', 'kiraya', 'book car', 'hire', 'booking', 'rentcar'
        ]
    },
    {
        name: 'Rent Out Car',
        path: '/post-rent-car',
        keywords: [
            'rent out', 'kiraye par deni', 'rent offer'
        ]
    },
    {
        name: 'Buy For Me',
        path: '/buy-car-for-me',
        keywords: [
            'buy for me', 'manage', 'assistant', 'madad', 'help me buy', 'finance', 'loan', 'installment', 'buycarforme'
        ]
    },
    {
        name: 'Managed Service',
        path: '/list-it-for-you',
        keywords: [
            'list it for me', 'manage selling', 'premium sell', 'vip', 'listit'
        ]
    },

    // --- USER DASHBOARD ---
    {
        name: 'Profile',
        path: '/profile',
        keywords: [
            'profile', 'account', 'login', 'signup', 'register', 'dashboard', 'my account', 'setting', 'id', 'myprofile'
        ]
    },
    {
        name: 'My Ads',
        path: '/my-ads',
        keywords: [
            'my ads', 'my listings', 'meray ads', 'manage ads', 'active ads', 'myads'
        ]
    },
    {
        name: 'Dealer Packages',
        path: '/dealer-packages',
        keywords: [
            'packages', 'plans', 'pricing', 'dealer', 'membership', 'credits', 'coins', 'boost'
        ]
    },

    // --- COMPANY & STATIC ---
    {
        name: 'Contact Us',
        path: '/contact',
        keywords: [
            'contact', 'rabta', 'phone', 'number', 'email', 'address', 'location', 'support', 'call', 'help line', 'contactus'
        ]
    },
    {
        name: 'About Us',
        path: '/about',
        keywords: [
            'about', 'company', 'who are we', 'mission', 'team', 'hum kon', 'aboutus'
        ]
    },
    {
        name: 'FAQ',
        path: '/faq',
        keywords: [
            'faq', 'help', 'question', 'answer', 'sawal', 'jawab', 'support center', 'faqs'
        ]
    },
    {
        name: 'Privacy Policy',
        path: '/privacy-policy',
        keywords: [
            'policy', 'privacy', 'terms', 'conditions', 'rules', 'qanoon', 'legal', 'privacypolicy'
        ]
    },

    // --- HOME PAGE SECTIONS (SCROLL TARGETS) ---
    {
        name: 'Autofinder Services',
        path: '/',
        sectionId: 'autofinder-services',
        keywords: [
            'autofinder services', 'services', 'autofinder', 'managed', 'managed cars', 'premium service'
        ]
    },

    // --- GENERAL ---
    {
        name: 'Home',
        path: '/',
        keywords: [
            'home', 'main', 'start', 'shuru', 'wapis', 'back', 'homepage'
        ]
    }
];

/**
 * Analyzes voice command text to determine user intent for navigation or search.
 * 
 * @param {string} text - The recognized voice text.
 * @param {object} options - Optional settings (silent: bool).
 * @returns {object} - { action: 'NAVIGATE' | 'SCROLL' | 'SEARCH' | 'NONE', path: string | null, sectionId?: string }
 */
export const analyzeVoiceCommand = (text, options = { silent: false }) => {
    if (!text || typeof text !== 'string') return { action: 'NONE', path: null };

    const cleanText = text.toLowerCase().trim();

    // Stop words to ignore for better matching
    const stopWords = ['open', 'kholo', 'show', 'dikhao', 'page', 'mujhay', 'i', 'want', 'to', 'go', 'hai', 'ka', 'ki', 'wala'];

    // Remove punctuation (e.g., "auto-store" -> "autostore") for fuzzy match
    const normalizedText = cleanText.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
    const compactedText = normalizedText.replace(/\s+/g, ''); // "autostore"

    const tokens = normalizedText.split(/\s+/).filter(t => !stopWords.includes(t));

    if (tokens.length === 0) return { action: 'NONE', path: null };

    let bestMatch = null;
    let maxScore = 0;

    // Scoring Logic
    ROUTES_MAP.forEach(route => {
        let score = 0;

        route.keywords.forEach(keyword => {
            // Normalize keyword too
            const normKeyword = keyword.replace(/[^a-z0-9\s]/g, '').toLowerCase();

            // 1. Exact full normalized match (High Priority)
            if (normalizedText.includes(normKeyword)) {
                score += 10 + (keyword.length * 0.5);
            }

            // 2. Compact Match (e.g. "autostore" vs "auto store")
            if (normKeyword.replace(/\s+/g, '') === compactedText) {
                score += 15;
            }

            // 3. Token overlap (Medium Priority)
            const keywordTokens = normKeyword.split(' ');
            keywordTokens.forEach(kt => {
                if (tokens.includes(kt)) {
                    score += 3;
                }
            });
        });

        if (score > maxScore) {
            maxScore = score;
            bestMatch = route;
        }
    });

    // Threshold (2 is enough for distinct keywords)
    if (maxScore >= 2 && bestMatch) {
        // Check if this is a scroll target (has sectionId)
        if (bestMatch.sectionId) {
            if (!options.silent) {
                toast.info(`Navigating to ${bestMatch.name}...`, { autoClose: 2000 });
            }
            console.log(`Voice Match: "${text}" -> ${bestMatch.name} (SCROLL to #${bestMatch.sectionId}) Score: ${maxScore}`);
            return { action: 'SCROLL', path: bestMatch.path, sectionId: bestMatch.sectionId };
        }

        // Regular navigation
        if (!options.silent) {
            toast.info(`Navigating to ${bestMatch.name}...`, { autoClose: 2000 });
        }
        console.log(`Voice Match: "${text}" -> ${bestMatch.name} (${bestMatch.path}) Score: ${maxScore}`);
        return { action: 'NAVIGATE', path: bestMatch.path };
    }

    // Default Fallback
    console.log(`Voice Command: "${text}" - No navigation match (Max Score: ${maxScore}). Fallback to SEARCH.`);
    return { action: 'SEARCH', path: null };
};
