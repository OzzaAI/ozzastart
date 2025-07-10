'use client';

import { useState } from 'react';
import { Trash2, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'error';
  ssl_status?: 'pending' | 'issued' | 'error' | 'expired';
  created_at: string;
  verified_at?: string;
  ssl_issued_at?: string;
}

interface DomainListProps {
  domains: Domain[];
  onRemove: (domain: string) => Promise<void>;
  onAdd: () => void;
  onVerify: (domain: string) => Promise<void>;
  isLoading?: boolean;
}

export default function DomainList({ 
  domains, 
  onRemove, 
  onAdd, 
  onVerify, 
  isLoading = false 
}: DomainListProps) {
  const [removingDomain, setRemovingDomain] = useState<string | null>(null);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);

  const handleRemove = async (domain: string) => {
    if (!confirm('Are you sure you want to remove this custom domain? Your site will no longer be accessible at this address.')) {
      return;
    }

    setRemovingDomain(domain);
    try {
      await onRemove(domain);
    } finally {
      setRemovingDomain(null);
    }
  };

  const handleVerify = async (domain: string) => {
    setVerifyingDomain(domain);
    try {
      await onVerify(domain);
    } finally {
      setVerifyingDomain(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Verification';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Custom Domains</h3>
          <p className="text-sm text-gray-500">
            Connect your own domain to your agency portal
          </p>
        </div>
        <button
          onClick={onAdd}
          disabled={isLoading}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </button>
      </div>

      {domains.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 0L9 9m0 0l3-3m-3 3l3 3" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No custom domains</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first custom domain.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {domains.map((domain) => (
              <li key={domain.id} className="px-4 py-4 sm:px-6">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">{getStatusIcon(domain.status)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {domain.domain}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getStatusText(domain.status)}
                        {domain.status === 'verified' && domain.verified_at && (
                          <span className="ml-2 text-xs">
                            Verified {new Date(domain.verified_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                      {domain.status === 'verified' && (
                        <p className="text-xs text-gray-400">
                          SSL: {domain.ssl_status === 'issued' ? (
                            <span className="text-green-600">Secure</span>
                          ) : (
                            <span className="text-yellow-600">Pending</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {domain.status === 'pending' && (
                      <button
                        onClick={() => handleVerify(domain.domain)}
                        disabled={verifyingDomain === domain.domain}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {verifyingDomain === domain.domain ? 'Verifying...' : 'Verify'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemove(domain.domain)}
                      disabled={removingDomain === domain.domain}
                      className="inline-flex items-center p-1 border border-transparent rounded text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}