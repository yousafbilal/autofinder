import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { server_ip, ContactInfo } from '../Utils/Data';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    try {
      setLoading(true);

      const API_URL = server_ip || 'http://localhost:8001';
      const endpoint = `${API_URL}/contact`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        let message = 'Failed to send your message. Please try again.';
        try {
          const data = await response.json();
          if (data?.message) message = data.message;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      setSuccess(true);
      toast.success('Your message has been sent successfully!');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      console.error('Error sending contact message:', err);
      setError(err.message || 'Failed to send your message. Please try again.');
      toast.error('Failed to send your message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - Auto Finder</title>
      </Helmet>

      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8 transition-colors font-sans">
        <div className="mx-auto px-4 max-w-6xl">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 text-center drop-shadow-lg transform transition-all duration-500 hover:scale-105">Contact Us</h1>

          <div className="flex flex-col md:flex-row justify-center gap-12 items-stretch">
            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl p-5 border border-gray-100 dark:border-gray-700 w-full md:max-w-md flex flex-col transform transition-all duration-300 hover:-translate-y-2">
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Send Message</h2>

              {/* Status Messages */}
              {success && (
                <div className="mb-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400 px-4 py-1.5 rounded-xl text-[10px]">
                  Your message has been sent successfully!
                </div>
              )}
              {error && (
                <div className="mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-1.5 rounded-xl text-[10px]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-1.5 flex-grow flex flex-col">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[10px] font-semibold mb-0.5">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[10px] font-semibold mb-0.5">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[10px] font-semibold mb-0.5">Phone (Optional)</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[10px] font-semibold mb-0.5">Message</label>
                  <textarea
                    rows="2"
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-red-500 transition-all resize-none"
                    placeholder="How can we help?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold text-sm shadow-lg transform transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
                >
                  {loading ? '...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl p-6 border border-gray-100 dark:border-gray-700 w-full md:max-w-md flex flex-col transform transition-all duration-300 hover:-translate-y-2">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Get in Touch</h2>
              <div className="space-y-11 flex-grow flex flex-col justify-center">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">Address</h3>
                    <p className="text-gray-600 dark:text-gray-400">{ContactInfo.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-400">+923348400943</p>
                    <p className="text-sm text-red-600 font-medium">24/7 Support Line</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">Email</h3>
                    <a href="https://mail.google.com/mail/u/0/?view=cm&to=autofinder786@gmail.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors">
                      autofinder786@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Contact;

