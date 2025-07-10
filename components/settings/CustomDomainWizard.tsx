'use client';

import { useState } from 'react';
import { X, Check, Copy, ExternalLink } from 'lucide-react';

interface VerificationInfo {
  type: string;
  hostname: string;
  value: string;
}

interface CustomDomainWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CustomDomainWizard({
  isOpen,
  onClose,
  onComplete
}: CustomDomainWizardProps) {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState<VerificationInfo | null>(null);

  const handleAddDomain = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: domain.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add domain');
      }

      if (data.needsVerification && data.verification) {
        setVerification(data.verification);
        setStep(2);
      } else {
        // Domain was added and verified immediately
        onComplete();
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify domain');
      }

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setDomain('');
    setError('');
    setVerification(null);
    onClose();
  };

  const handleComplete = () => {
    onComplete();
    handleClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Add Custom Domain
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 1 ? <Check className="h-5 w-5" /> : '1'}
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 2 ? <Check className="h-5 w-5" /> : '2'}
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 3 ? <Check className="h-5 w-5" /> : '3'}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Enter Domain</span>
            <span>Configure DNS</span>
            <span>Complete</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Enter Domain */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                Domain Name
              </label>
              <input
                type="text"
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="portal.myagency.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the domain you want to connect to your agency portal.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                disabled={isLoading || !domain.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: DNS Configuration */}
        {step === 2 && verification && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Configure DNS Record
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Add the following DNS record at your domain provider to verify ownership:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <span className="text-sm text-gray-900 font-mono">{verification.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900 font-mono">{verification.hostname}</span>
                    <button
                      onClick={() => copyToClipboard(verification.hostname)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Value:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900 font-mono">{verification.value}</span>
                    <button
                      onClick={() => copyToClipboard(verification.value)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> DNS changes can take up to 24 hours to propagate, 
                  but usually take just a few minutes. You can verify once the record is added.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyDomain}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Domain'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Domain Verified Successfully!
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Your custom domain <strong>{domain}</strong> is now connected and active.
              </p>
              <p className="text-sm text-gray-500">
                It may take a few minutes for the HTTPS certificate to be fully enabled.
              </p>
            </div>

            <div className="flex justify-center space-x-3">
              <a
                href={`https://${domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-md hover:bg-indigo-50"
              >
                Visit Site
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
              <button
                onClick={handleComplete}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}