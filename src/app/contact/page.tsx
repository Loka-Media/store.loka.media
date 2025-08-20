'use client';

import Navigation from '@/components/Navigation';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    console.log('Contact form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-400">
            We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a topic</option>
                  <option value="general">General Inquiry</option>
                  <option value="creator">Creator Application</option>
                  <option value="support">Customer Support</option>
                  <option value="technical">Technical Issue</option>
                  <option value="partnership">Partnership Inquiry</option>
                  <option value="press">Press & Media</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">General Inquiries</h3>
                <p className="text-gray-400 mb-2">
                  For general questions about Loka Media
                </p>
                <a 
                  href="mailto:hello@loka.media" 
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  hello@loka.media
                </a>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Creator Support</h3>
                <p className="text-gray-400 mb-2">
                  For creators needing help with their account or products
                </p>
                <a 
                  href="mailto:creators@loka.media" 
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  creators@loka.media
                </a>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Customer Support</h3>
                <p className="text-gray-400 mb-2">
                  For order issues, returns, and customer service
                </p>
                <a 
                  href="mailto:support@loka.media" 
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  support@loka.media
                </a>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Technical Support</h3>
                <p className="text-gray-400 mb-2">
                  For website issues and technical problems
                </p>
                <a 
                  href="mailto:tech@loka.media" 
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  tech@loka.media
                </a>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Press & Media</h3>
                <p className="text-gray-400 mb-2">
                  For media inquiries and press requests
                </p>
                <a 
                  href="mailto:press@loka.media" 
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  press@loka.media
                </a>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-3">Response Time</h3>
              <p className="text-gray-400">
                We typically respond to all inquiries within 24 hours during business days (Monday-Friday, 9 AM - 6 PM EST).
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-3">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.706 13.742 3.706 12.446s.492-2.448 1.297-3.323C5.9 8.248 7.051 7.756 8.348 7.756s2.448.492 3.323 1.297c.897.897 1.389 2.048 1.389 3.345s-.492 2.448-1.297 3.323c-.897.897-2.048 1.389-3.345 1.389zm7.84-9.297c-.297 0-.54-.108-.729-.297-.189-.189-.297-.432-.297-.729s.108-.54.297-.729c.189-.189.432-.297.729-.297s.54.108.729.297c.189.189.297.432.297.729s-.108.54-.297.729c-.189.189-.432.297-.729.297z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}