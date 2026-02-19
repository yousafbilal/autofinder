import React, { useEffect, useCallback } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const VoiceSearch = ({ onResult, className = "", silent = false }) => {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable
    } = useSpeechRecognition();

    // Define term mappings and particles
    const termMappings = {
        // Brands
        'ہونڈا': 'Honda',
        'ٹویوٹا': 'Toyota',
        'سوزوکی': 'Suzuki',
        'ہنڈائی': 'Hyundai',
        'کیا': 'Kia',
        'مرسڈیز': 'Mercedes',
        'بی ایم ڈبلیو': 'BMW',
        'آڈی': 'Audi',
        'نسان': 'Nissan',
        'متسوبشی': 'Mitsubishi',
        'فورڈ': 'Ford',
        'شیورلیٹ': 'Chevrolet',
        'لیکسس': 'Lexus',
        'ایم جی': 'MG',
        'چنگان': 'Changan',
        'پروٹون': 'Proton',
        'ہیول': 'Haval',
        'چیری': 'Chery',
        'اوپل': 'Opel',
        'پورش': 'Porsche',
        'رینو': 'Renault',
        'ٹیلکو': 'Telco',
        'ڈاٹسن': 'Datsun',
        'ولیز': 'Willys',
        'پروٹان': 'Proton',

        // Models
        'الٹو': 'Alto',
        'کلٹس': 'Cultus',
        'سٹی': 'City',
        'سیوک': 'Civic',
        'کرولا': 'Corolla',
        'مہران': 'Mehran',
        'ویگن آر': 'Wagon R',
        'سوئفٹ': 'Swift',
        'خیبر': 'Khyber',
        'بولان': 'Bolan',
        'راوی': 'Ravi',
        'ایوری': 'Every',
        'لنکس': 'Lynx',
        'یارس': 'Yaris',
        'ٹکسن': 'Tucson',
        'ایلانٹرا': 'Elantra',
        'سوناٹا': 'Sonata',
        'اسپورٹیج': 'Sportage',
        'پیکانٹو': 'Picanto',
        'سورینٹو': 'Sorento',
        'فورچیونر': 'Fortuner',
        'ہائلکس': 'Hilux',
        'پراڈو': 'Prado',
        'لینڈ کروزر': 'Land Cruiser',
        'ویٹز': 'Vitz',
        'پاسل': 'Passo',
        'ایکوا': 'Aqua',
        'پریوس': 'Prius',
        'ویزول': 'Vezel',

        // Cities
        'کراچی': 'Karachi',
        'لاہور': 'Lahore',
        'اسلام آباد': 'Islamabad',
        'راولپنڈی': 'Rawalpindi',
        'پشاور': 'Peshawar',
        'فیصل آباد': 'Faisalabad',
        'ملتان': 'Multan',
        'گوجرانوالہ': 'Gujranwala',
        'سیالکوٹ': 'Sialkot',
        'سرگودھا': 'Sargodha',
        'ایبٹ آباد': 'Abbottabad',
        'حیدرآباد': 'Hyderabad',
        'کوئٹہ': 'Quetta',
        'اوکاڑہ': 'Okara',
        'بھاولپور': 'Bahawalpur',
        'گجرات': 'Gujrat',
        'سکھر': 'Sukkur',
        'جھنگ': 'Jhang',
        'شیخوپورہ': 'Sheikhupura',
        'مردان': 'Mardan',
        'قصور': 'Kasur',
        'رحیم یار خان': 'Rahim Yar Khan',
        'ساہیوال': 'Sahiwal',
        'واہ': 'Wah',

        // Colors
        'سفید': 'White',
        'کالے': 'Black',
        'کالا': 'Black',
        'سلور': 'Silver',
        'گرے': 'Grey',
        'نیلا': 'Blue',
        'نیلے': 'Blue',
        'سرخ': 'Red',
        'لال': 'Red',
        'سبز': 'Green',
        'پیلا': 'Yellow',
        'سنہری': 'Gold',

        // General Terms
        'گاڑی': 'Car',
        'موٹر سائیکل': 'Bike',
        'سائیکل': 'Bike',
        'بائیک': 'Bike',
        'آٹومیٹک': 'Automatic',
        'مینول': 'Manual',
        'ماڈل': 'Model',
        'نئی': 'New',
        'نیا': 'New',
        'نیو': 'New',

        // Actions/Intents
        'ایڈ': 'Ad',
        'لگانا': 'Post',
        'بیچنی': 'Sell',
        'بیچنا': 'Sell',
        'بیچنے': 'Sell',
        'خریدنی': 'Buy',
        'خریدنا': 'Buy',
        'خریدنے': 'Buy',
        'اشتہار': 'Ad',
        'بائیک': 'Bike',
        'موٹرسائیکل': 'Bike',
        'گاڑی': 'Car',
        'کار': 'Car',
        'گاری': 'Car',
        'نئی': 'New',
        'نئی گاڑی': 'New Car',
    };

    const urduParticles = [
        'میں', 'کا', 'کی', 'کے', 'والا', 'والی', 'والے', 'سے', 'نے', 'کو', 'کر', 'پر', 'ہے', 'ہیں', 'اور', 'بھی'
    ];

    const processTranscript = useCallback((rawTranscript) => {
        let processed = rawTranscript;

        // Replace mapped terms
        Object.entries(termMappings).forEach(([urdu, english]) => {
            const regex = new RegExp(urdu, 'g');
            processed = processed.replace(regex, english);
        });

        // Strip Urdu particles
        urduParticles.forEach(particle => {
            const regex = new RegExp(`\\s+${particle}\\b|\\b${particle}\\s+`, 'g');
            processed = processed.replace(regex, ' ');
        });

        // Final cleaning
        processed = processed.replace(/[\u0600-\u06FF]/g, '') // Remove remaining Urdu
            .replace(/\s+/g, ' ') // Collapse spaces
            .trim();

        return processed;
    }, []);

    // Handle transcript changes
    useEffect(() => {
        if (!listening && transcript) {
            const processed = processTranscript(transcript);
            console.log('Voice Result:', processed);
            if (onResult) {
                onResult(processed);
            }
        }
    }, [listening, transcript, onResult, processTranscript]);

    const toggleListening = () => {
        if (!browserSupportsSpeechRecognition) {
            if (!silent) toast.error("Browser doesn't support speech recognition.");
            return;
        }

        if (!isMicrophoneAvailable) {
            if (!silent) toast.error("Microphone is not available.");
            // Continue anyway as sometimes this check is flaky in dev
        }

        if (listening) {
            SpeechRecognition.stopListening();
        } else {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: false, language: 'en-IN' });
        }
    };

    if (!browserSupportsSpeechRecognition) {
        return null;
    }

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                toggleListening();
            }}
            className={`relative flex items-center justify-center p-2 rounded-full transition-all duration-300 ${listening
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500 animate-pulse'
                : 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'
                } ${className}`}
            title={listening ? "Stop Listening" : "Voice Search"}
        >
            {listening ? (
                <div className="relative">
                    <FaStop className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                </div>
            ) : (
                <FaMicrophone className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
        </button>
    );
};

export default VoiceSearch;
