import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import Header from './include/Header';
import Footer from './include/Footer';
import { server_ip } from '../Utils/Data';
import './Auth.css';

// ⚠️ IMPORTANT: InputWithAsterisk must be defined OUTSIDE the Auth component.
// If defined inside, React creates a new component type on every render, causing
// focus loss on every keystroke.
const InputWithAsterisk = ({ type = "text", name, placeholder, value, onChange }) => (
    <div className="relative w-full my-0.5">
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="bg-gray-100 dark:bg-gray-700 border-none px-3 py-1.5 w-full rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            required
        />
        {!value && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sm text-gray-500 dark:text-gray-400">
                {placeholder}<span className="text-red-500 ml-0.5">*</span>
            </div>
        )}
    </div>
);

function Auth() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSignUp, setIsSignUp] = useState(false);

    // Sign In State
    const [signInData, setSignInData] = useState({ emailOrPhone: '', password: '' });
    const [signInLoading, setSignInLoading] = useState(false);
    const [signInError, setSignInError] = useState(null);
    const [showSignInPassword, setShowSignInPassword] = useState(false);

    // Sign Up State
    const [signUpData, setSignUpData] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: ''
    });
    const [signUpLoading, setSignUpLoading] = useState(false);
    const [signUpError, setSignUpError] = useState(null);

    // OTP State
    const [otpStep, setOtpStep] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpUserId, setOtpUserId] = useState(null);
    const [otpPhone, setOtpPhone] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState(null);

    // Login OTP State
    const [loginOtpStep, setLoginOtpStep] = useState(false);
    const [loginOtp, setLoginOtp] = useState('');
    const [loginOtpUserId, setLoginOtpUserId] = useState(null);
    const [loginOtpPhone, setLoginOtpPhone] = useState('');
    const [loginOtpLoading, setLoginOtpLoading] = useState(false);
    const [loginOtpError, setLoginOtpError] = useState(null);

    useEffect(() => {
        if (location.pathname === '/signup') {
            setIsSignUp(true);
        } else {
            setIsSignUp(false);
        }
    }, [location.pathname]);

    const handlePanelSwitch = (status) => {
        setIsSignUp(status);
        setOtpStep(false);
        setLoginOtpStep(false);
        const newPath = status ? '/signup' : '/signin';
        window.history.replaceState(null, '', newPath);
    };

    // ----- Sign In Handlers -----
    const handleSignInChange = useCallback((e) => {
        const { name, value } = e.target;
        setSignInData(prev => ({ ...prev, [name]: value }));
        setSignInError(null);
    }, []);

    const handleSignInSubmit = async (e) => {
        e.preventDefault();
        setSignInError(null);
        setSignInLoading(true);

        if (!signInData.emailOrPhone || !signInData.password) {
            setSignInError('Please enter both email/phone and password');
            setSignInLoading(false);
            return;
        }

        try {
            const API_URL = server_ip || 'http://localhost:8001';
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signInData),
                mode: 'cors',
                credentials: 'omit',
            });

            const data = await response.json();

            if (data.success && data.requireOtp) {
                // User needs OTP verification
                setLoginOtpUserId(data.userId);
                setLoginOtpPhone(data.phone);
                setLoginOtpStep(true);
                toast.info('OTP sent to your WhatsApp/SMS. Please verify.');
            } else if (data.success && data.token) {
                // Logged in directly
                const userData = {
                    token: data.token,
                    userId: data.userId,
                    _id: data.userId,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    dateAdded: data.dateAdded,
                    profileImage: data.profileImage,
                    userType: data.userType,
                };
                localStorage.setItem('user', JSON.stringify(userData));
                toast.success('Login successful!');
                setTimeout(() => { navigate('/'); window.location.reload(); }, 800);
            } else {
                setSignInError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setSignInError('An error occurred during login. Please try again.');
        } finally {
            setSignInLoading(false);
        }
    };

    const handleLoginOtpVerify = async (e) => {
        e.preventDefault();
        if (!loginOtp || loginOtp.length < 4) {
            setLoginOtpError('Please enter a valid OTP.');
            return;
        }
        setLoginOtpLoading(true);
        setLoginOtpError(null);
        try {
            const API_URL = server_ip || 'http://localhost:8001';
            const response = await fetch(`${API_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loginOtpUserId, otp: loginOtp }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                const userData = {
                    token: data.token,
                    userId: data.userId,
                    _id: data.userId,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    profileImage: data.profileImage,
                    userType: data.userType,
                };
                localStorage.setItem('user', JSON.stringify(userData));
                toast.success('Verified! Logging you in...');
                setTimeout(() => { navigate('/'); window.location.reload(); }, 800);
            } else {
                setLoginOtpError(data.message || 'OTP verification failed.');
            }
        } catch (err) {
            setLoginOtpError('Error verifying OTP. Please try again.');
        } finally {
            setLoginOtpLoading(false);
        }
    };

    // ----- Sign Up Handlers -----
    const handleSignUpChange = useCallback((e) => {
        const { name, value } = e.target;
        setSignUpData(prev => ({ ...prev, [name]: value }));
        setSignUpError(null);
    }, []);

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setSignUpError(null);
        setSignUpLoading(true);

        if (!signUpData.name || !signUpData.email || !signUpData.phone || !signUpData.password) {
            setSignUpError('Please fill in all required fields');
            setSignUpLoading(false);
            return;
        }
        if (signUpData.password.length < 8) {
            setSignUpError('Password must be at least 8 characters long');
            setSignUpLoading(false);
            return;
        }
        if (signUpData.password !== signUpData.confirmPassword) {
            setSignUpError('Passwords do not match');
            setSignUpLoading(false);
            return;
        }

        try {
            const API_URL = server_ip || 'http://localhost:8001';
            const formDataToSend = new FormData();
            formDataToSend.append('name', signUpData.name);
            formDataToSend.append('email', signUpData.email);
            formDataToSend.append('phone', signUpData.phone);
            formDataToSend.append('password', signUpData.password);

            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                body: formDataToSend,
                mode: 'cors',
                credentials: 'omit',
            });

            const data = await response.json();

            if (response.ok && data.success) {
                if (data.requireOtp && data.data?.id) {
                    // Show OTP step
                    setOtpUserId(data.data.id);
                    setOtpPhone(signUpData.phone);
                    setOtpStep(true);
                    toast.info('OTP sent to your WhatsApp/SMS!');
                } else if (!data.requireOtp && data.token) {
                    // Direct login (OTP not available — auto-verified)
                    const userData = {
                        token: data.token,
                        userId: data.userId,
                        _id: data.userId,
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        profileImage: data.profileImage,
                        userType: data.userType,
                    };
                    localStorage.setItem('user', JSON.stringify(userData));
                    toast.success('Account created! Welcome to AutoFinder!');
                    setTimeout(() => { navigate('/'); window.location.reload(); }, 800);
                } else {
                    toast.success('Account created successfully! Please login.');
                    handlePanelSwitch(false);
                    setSignUpData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
                }
            } else {
                setSignUpError(data.message || 'Signup failed. Please try again.');
            }
        } catch (err) {
            console.error('Signup error:', err);
            setSignUpError('An error occurred during signup. Please try again.');
        } finally {
            setSignUpLoading(false);
        }
    };

    const handleOtpVerify = async (e) => {
        e.preventDefault();
        if (!otp || otp.length < 4) {
            setOtpError('Please enter a valid OTP.');
            return;
        }
        setOtpLoading(true);
        setOtpError(null);
        try {
            const API_URL = server_ip || 'http://localhost:8001';
            const response = await fetch(`${API_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: otpUserId, otp }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                const userData = {
                    token: data.token,
                    userId: data.userId,
                    _id: data.userId,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    profileImage: data.profileImage,
                    userType: data.userType,
                };
                localStorage.setItem('user', JSON.stringify(userData));
                toast.success('Account verified! Welcome to AutoFinder!');
                setTimeout(() => { navigate('/'); window.location.reload(); }, 800);
            } else {
                setOtpError(data.message || 'OTP verification failed.');
            }
        } catch (err) {
            setOtpError('Error verifying OTP. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    // ----- Mobile Toggle -----
    const MobileToggle = () => (
        <div className="md:hidden text-center mt-4 pb-4">
            {isSignUp ? (
                <p className="text-gray-600">
                    Already have an account?{' '}
                    <button onClick={() => handlePanelSwitch(false)} className="text-red-600 font-bold hover:underline">Sign In</button>
                </p>
            ) : (
                <p className="text-gray-600">
                    Don't have an account?{' '}
                    <button onClick={() => handlePanelSwitch(true)} className="text-red-600 font-bold hover:underline">Sign Up</button>
                </p>
            )}
        </div>
    );

    return (
        <>
            <Helmet>
                <title>{isSignUp ? 'Sign Up' : 'Sign In'} - Autofinder</title>
            </Helmet>
            <Header />

            <div className="auth-container-wrapper relative overflow-hidden bg-gray-100 dark:bg-gray-900 py-10 min-h-screen flex items-center justify-center">
                {/* Background Image */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <img
                        src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=1080&fit=crop"
                        alt="Car Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70"></div>
                </div>

                <div className={`auth-container container z-10 ${isSignUp ? 'right-panel-active' : ''}`} id="container">

                    {/* ===== Sign Up Container ===== */}
                    <div className="form-container sign-up-container">
                        <form onSubmit={otpStep ? handleOtpVerify : handleSignUpSubmit} className="dark:bg-gray-800">

                            {otpStep ? (
                                /* OTP Verification Step */
                                <>
                                    <h1 className="font-bold text-xl mb-1 text-gray-800 dark:text-white">Verify OTP</h1>
                                    <p className="text-gray-500 dark:text-gray-300 text-xs mb-2 text-center">
                                        Enter the code sent to your WhatsApp/SMS<br />
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{otpPhone}</span>
                                    </p>

                                    {otpError && <p className="text-red-500 text-[10px] mb-1">{otpError}</p>}

                                    <div className="relative w-full my-0.5">
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => { setOtp(e.target.value); setOtpError(null); }}
                                            maxLength={6}
                                            className="bg-gray-100 dark:bg-gray-700 border-none px-3 py-2 w-full rounded text-center text-xl font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-red-500"
                                            placeholder="------"
                                            required
                                        />
                                    </div>

                                    <button type="submit" disabled={otpLoading} className="mt-2 text-xs py-2 px-6">
                                        {otpLoading ? 'Verifying...' : 'Verify OTP'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setOtpStep(false); setOtp(''); setOtpError(null); }}
                                        style={{ background: 'none', border: 'none', marginTop: '8px', fontSize: '11px', color: '#888', cursor: 'pointer' }}
                                    >
                                        ← Back to Signup
                                    </button>
                                </>
                            ) : (
                                /* Signup Form */
                                <>
                                    <h1 className="font-bold text-xl mb-1 text-gray-800 dark:text-white">Create Account</h1>
                                    <div className="social-container text-gray-500 dark:text-gray-300 mb-1 scale-75 origin-center">
                                        <span>Use your email for registration</span>
                                    </div>

                                    {signUpError && <p className="text-red-500 text-[10px] mb-0">{signUpError}</p>}

                                    <InputWithAsterisk name="name" placeholder="Name" value={signUpData.name} onChange={handleSignUpChange} />
                                    <InputWithAsterisk type="email" name="email" placeholder="Email" value={signUpData.email} onChange={handleSignUpChange} />
                                    <InputWithAsterisk type="tel" name="phone" placeholder="Phone (03xxxxxxxxx)" value={signUpData.phone} onChange={handleSignUpChange} />
                                    <InputWithAsterisk type="password" name="password" placeholder="Password (min 8 chars)" value={signUpData.password} onChange={handleSignUpChange} />
                                    <InputWithAsterisk type="password" name="confirmPassword" placeholder="Confirm Password" value={signUpData.confirmPassword} onChange={handleSignUpChange} />

                                    <button type="submit" disabled={signUpLoading} className="mt-2 text-xs py-2 px-6">
                                        {signUpLoading ? 'Creating...' : 'Sign Up'}
                                    </button>
                                    <MobileToggle />
                                </>
                            )}
                        </form>
                    </div>

                    {/* ===== Sign In Container ===== */}
                    <div className="form-container sign-in-container">
                        <form onSubmit={loginOtpStep ? handleLoginOtpVerify : handleSignInSubmit} className="dark:bg-gray-800">

                            {loginOtpStep ? (
                                /* Login OTP Step */
                                <>
                                    <h1 className="font-bold text-xl mt-4 mb-0 text-gray-800 dark:text-white">Verify OTP</h1>
                                    <p className="text-gray-500 dark:text-gray-300 text-xs mb-2 text-center">
                                        Code sent to <span className="font-semibold">{loginOtpPhone}</span>
                                    </p>

                                    {loginOtpError && <p className="text-red-500 text-xs mb-1">{loginOtpError}</p>}

                                    <input
                                        type="text"
                                        value={loginOtp}
                                        onChange={(e) => { setLoginOtp(e.target.value); setLoginOtpError(null); }}
                                        maxLength={6}
                                        className="bg-gray-100 dark:bg-gray-700 border-none px-3 py-2 my-0.5 w-full rounded text-center text-xl font-bold tracking-widest"
                                        placeholder="------"
                                        required
                                    />

                                    <button type="submit" disabled={loginOtpLoading} className="mt-2 text-xs py-2 px-6">
                                        {loginOtpLoading ? 'Verifying...' : 'Verify OTP'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setLoginOtpStep(false); setLoginOtp(''); setLoginOtpError(null); }}
                                        style={{ background: 'none', border: 'none', marginTop: '8px', fontSize: '11px', color: '#888', cursor: 'pointer' }}
                                    >
                                        ← Back to Login
                                    </button>
                                </>
                            ) : (
                                /* Login Form */
                                <>
                                    <h1 className="font-bold text-xl mt-4 mb-0 text-gray-800 dark:text-white">Sign in</h1>
                                    <div className="social-container text-gray-500 dark:text-gray-300 mb-0 scale-75 origin-center">
                                        <span>or use your account</span>
                                    </div>

                                    {signInError && <p className="text-red-500 text-xs mb-1">{signInError}</p>}

                                    <input
                                        type="text" name="emailOrPhone" placeholder="Email or Phone"
                                        value={signInData.emailOrPhone} onChange={handleSignInChange}
                                        className="bg-gray-100 dark:bg-gray-700 border-none px-3 py-1.5 my-0.5 w-full rounded text-sm" required
                                    />
                                    <div className="relative w-full">
                                        <input
                                            type={showSignInPassword ? 'text' : 'password'} name="password" placeholder="Password"
                                            value={signInData.password} onChange={handleSignInChange}
                                            className="bg-gray-100 dark:bg-gray-700 border-none px-3 py-1.5 my-0.5 w-full rounded text-sm" required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSignInPassword(p => !p)}
                                            style={{ background: 'none', border: 'none', padding: 0, position: 'absolute', right: '15px', top: '10px', width: 'auto' }}
                                            className="text-gray-400 hover:text-gray-600 text-xs"
                                        >
                                            {showSignInPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>

                                    <a href="/forgot-password" onClick={(e) => { e.preventDefault(); toast.info("Forgot Password feature coming soon!"); }}
                                        className="text-xs my-2 text-gray-600 dark:text-gray-400 hover:text-black">
                                        Forgot your password?
                                    </a>

                                    <button type="submit" disabled={signInLoading} className="mt-2 text-xs py-2 px-6">
                                        {signInLoading ? 'Signing In...' : 'Sign In'}
                                    </button>
                                    <MobileToggle />
                                </>
                            )}
                        </form>
                    </div>

                    {/* Overlay Container (Sliding Panel) */}
                    <div className="overlay-container">
                        <div className="overlay">
                            <div className="overlay-panel overlay-left">
                                <h1 className="font-bold text-3xl text-white mb-4">Welcome Back!</h1>
                                <p className="text-white mb-8">To keep connected with us please login with your personal info</p>
                                <button className="ghost" id="signIn" onClick={() => handlePanelSwitch(false)}>Sign In</button>
                            </div>
                            <div className="overlay-panel overlay-right">
                                <h1 className="font-bold text-3xl text-white mb-4">AUTOFINDERS</h1>
                                <p className="text-white mb-8">Enter your personal details and start your journey with us</p>
                                <button className="ghost" id="signUp" onClick={() => handlePanelSwitch(true)}>Sign Up</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default Auth;
