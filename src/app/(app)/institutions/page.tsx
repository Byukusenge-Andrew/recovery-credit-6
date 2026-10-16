'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/store';
import { institutionsApi, InstitutionWithMetrics } from '@/services/api';
import { formatCurrency } from '@/lib/constants';
import { useLanguage } from '@/components/LanguageContext';
import type { User, FinancialInstitution } from '@/lib/types';

export default function InstitutionsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Institution Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [institutionType, setInstitutionType] = useState('commercial_bank');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const data = await institutionsApi.list();
      setInstitutions(data);
    } catch (err) {
      console.warn('Failed to load institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadInstitutions();
  }, []);

  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Please enter an institution name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await institutionsApi.create({
        name: name.trim(),
        code: code.trim(),
        institutionType,
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        actorUsername: currentUser?.username || 'admin',
        actorFullName: currentUser?.fullName || 'Admin'
      });

      // Reset and reload
      setName('');
      setCode('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
      setShowAddModal(false);
      loadInstitutions();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving institution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = 
      !search ||
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      (inst.code && inst.code.toLowerCase().includes(search.toLowerCase())) ||
      (inst.contactPerson && inst.contactPerson.toLowerCase().includes(search.toLowerCase()));

    const matchesType = filterType === 'all' || inst.institutionType === filterType;
    return matchesSearch && matchesType;
  });

  const totalPortfolioClaim = institutions.reduce((acc, curr) => acc + (curr.metrics?.totalOutstanding || 0), 0);
  const totalPortfolioRecovered = institutions.reduce((acc, curr) => acc + (curr.metrics?.totalPaid || 0), 0);
  const totalPortfolioDebtors = institutions.reduce((acc, curr) => acc + (curr.metrics?.debtorsCount || 0), 0);
  const overallRate = totalPortfolioClaim > 0 ? Math.round((totalPortfolioRecovered / totalPortfolioClaim) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('nav_institutions')}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage partner banks, credit lenders, and portfolio debt collection performance by institution.
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm self-start sm:self-auto"
          >
            <span>+</span>
            <span>Add Financial Institution</span>
          </button>
        )}
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Institutions Enrolled</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{institutions.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333M4.5 21V10.333M4.5 21h15" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Institutional Debtors</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalPortfolioDebtors}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Portfolio Value</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPortfolioClaim)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Overall Recovery Rate</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{overallRate}%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search institution by name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 transition"
          >
            <option value="all">All Institution Types</option>
            <option value="commercial_bank">Commercial Bank</option>
            <option value="microfinance">Microfinance</option>
            <option value="credit_union">Credit Union</option>
            <option value="fintech">Fintech & Digital Lender</option>
          </select>
        </div>
      </div>

      {/* Financial Institutions Card Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3">Loading financial institutions from Neon PostgreSQL...</p>
        </div>
      ) : filteredInstitutions.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333M4.5 21V10.333M4.5 21h15" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">No Financial Institutions Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search ? 'No institution matched your filter.' : 'Get started by creating your first client bank or lending partner.'}
          </p>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
            >
              + Register Institution
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInstitutions.map((inst) => {
            const m = inst.metrics || { debtorsCount: 0, totalOutstanding: 0, totalPaid: 0, totalBalance: 0, recoveryRate: 0 };
            return (
              <div
                key={inst.id}
                onClick={() => router.push(`/institutions/${inst.id}`)}
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-bold text-sm transition-colors shrink-0 shadow-sm">
                        {inst.code ? inst.code.slice(0, 3) : inst.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                          {inst.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {inst.institutionType?.replace('_', ' ') || 'Commercial Bank'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {m.debtorsCount} cases
                    </span>
                  </div>

                  {/* Financial Metrics Progress Bar */}
                  <div className="space-y-1.5 my-4">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>Recovery Progress</span>
                      <span className="font-bold text-slate-800">{m.recoveryRate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, m.recoveryRate)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Claims / Balance Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Total Claim</p>
                      <p className="font-bold text-slate-800 text-[11px]">{formatCurrency(m.totalOutstanding)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Outstanding Bal</p>
                      <p className="font-bold text-rose-600 text-[11px]">{formatCurrency(m.totalBalance)}</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="truncate">
                    {inst.contactPerson ? `Contact: ${inst.contactPerson}` : (inst.email || 'Partner')}
                  </span>
                  <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    View Portfolio →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Financial Institution */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Register Financial Institution</h3>
                <p className="text-xs text-slate-400 mt-0.5">Add partner bank, microfinance lender, or corporate credit client.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateInstitution} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Institution / Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Bank"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Code / Abbreviation</label>
                  <input
                    type="text"
                    placeholder="e.g. SB"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Institution Type</label>
                  <select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="commercial_bank">Commercial Bank</option>
                    <option value="microfinance">Microfinance</option>
                    <option value="credit_union">Credit Union</option>
                    <option value="fintech">Fintech & Digital Lender</option>
                    <option value="other">Other Institution</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Key Account Contact</label>
                  <input
                    type="text"
                    placeholder="Branch Manager / Loan Officer"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="loans@bank.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+27 11 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Address / Headquarters</label>
                <input
                  type="text"
                  placeholder="Street Address, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Escalation protocol, special rates, or mandate details"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-xs shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Save Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
