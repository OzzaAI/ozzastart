'use client'

import { useState } from 'react'

interface InvitationResult {
  invitationLink: string
  clientEmail: string
  clientName: string
  expiresAt: string
  accountName: string
}

export default function ClientInvitationGenerator() {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InvitationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!clientName.trim() || !clientEmail.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/generate-client-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate invitation')
      }

      setResult(data)
      setClientName('')
      setClientEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invitation')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const sendEmail = (invitationLink: string, clientEmail: string, clientName: string, accountName: string) => {
    const subject = encodeURIComponent(`Invitation to ${accountName} Client Portal`)
    const body = encodeURIComponent(`Hi ${clientName},

You've been invited to access your personalized client portal for ${accountName}.

Click the link below to get started:
${invitationLink}

This invitation will expire in 7 days.

Best regards,
${accountName} Team`)

    window.open(`mailto:${clientEmail}?subject=${subject}&body=${body}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Generate Client Invitation
      </h2>
      
      <form onSubmit={generateInvitation} className="space-y-4">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
            Client Name
          </label>
          <input
            type="text"
            id="clientName"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Enter client's full name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Client Email
          </label>
          <input
            type="email"
            id="clientEmail"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </span>
          ) : (
            'Generate Invitation Link'
          )}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-green-900 mb-3">
            ✅ Invitation Generated Successfully
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Client:</p>
              <p className="text-sm text-gray-600">{result.clientName} ({result.clientEmail})</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Invitation Link:</p>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="text"
                  value={result.invitationLink}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md"
                />
                <button
                  onClick={() => copyToClipboard(result.invitationLink)}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Expires:</p>
              <p className="text-sm text-gray-600">
                {new Date(result.expiresAt).toLocaleString()}
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => sendEmail(result.invitationLink, result.clientEmail, result.clientName, result.accountName)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                📧 Send Email
              </button>
              <button
                onClick={() => copyToClipboard(result.invitationLink)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-sm"
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}