/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryEmail || !inquiryMessage) return;
    setSentSuccess(true);
    setTimeout(() => {
      setInquiryName("");
      setInquiryEmail("");
      setInquiryMessage("");
      setSentSuccess(false);
    }, 3000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12" id="contact-page-container">
      {/* Overview Headings */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="font-sans text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl flex items-center justify-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          Connect With Kitchen Support
        </h1>
        <p className="font-sans text-sm text-slate-550 leading-relaxed">
          Reach our kitchen coordinators directly, inquire about catering services, or manage reservation details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Contact Info list */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6">
            <h3 className="font-sans text-base font-bold text-slate-800 border-b border-slate-50 pb-3">
              Savory Green HQ
            </h3>

            <div className="space-y-4 text-xs font-sans text-slate-600">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4.5 w-4.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed">
                  Gulshan Avenue, Circle 2, House 14B, <br />
                  Dhaka 1212, Bangladesh
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
                <p className="font-mono">+880 1721-938899</p>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
                <p className="font-medium">coordinator@savorygreen.com</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6">
            <h3 className="font-sans text-base font-bold text-slate-800 border-b border-slate-50 pb-3">
              Operating Schedule
            </h3>

            <div className="space-y-3 text-xs font-sans text-slate-600">
              <div className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5 font-medium">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Sunday – Thursday</span>
                </span>
                <span className="font-mono">11:00 AM – 11:00 PM</span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                <span className="flex items-center space-x-1.5 font-medium">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Friday – Saturday</span>
                </span>
                <span className="font-mono">10:00 AM – Midnight</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic inquiry feedback card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="space-y-1 mb-6">
            <h3 className="font-sans text-base font-bold text-slate-900">Inquire About Culinary Plans</h3>
            <p className="font-sans text-xs text-slate-400">Have a health diet request, wedding catering, or feedback? Send our coordinators a memo.</p>
          </div>

          <form onSubmit={handleInquirySubmit} className="space-y-4" id="inquiry-form">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sheikh Shohan"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-sans text-xs text-slate-900 outline-none focus:border-emerald-500"
                  id="inquiry-name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-sans text-xs text-slate-900 outline-none focus:border-emerald-500"
                  id="inquiry-email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Inquiry Message</label>
              <textarea
                required
                rows={4}
                placeholder="Details of catering inquiries, customized diet reservations..."
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-sans text-xs text-slate-900 outline-none focus:border-emerald-500"
                id="inquiry-msg"
              />
            </div>

            {sentSuccess && (
              <div className="flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-850" id="inquiry-success">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
                <span className="font-sans text-xs font-semibold">Your kitchen inquiry memo was dispatched successfully. Our coordinators will contact you soon.</span>
              </div>
            )}

            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-3.5 font-sans text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 flex items-center space-x-1.5 cursor-pointer ml-auto"
              id="inquiry-submit-btn"
            >
              <span>Dispatch Memo</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
