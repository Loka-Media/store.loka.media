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
                  For general questions about Loka
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

          </div>
        </div>
      </div>
    </div>
  );
}