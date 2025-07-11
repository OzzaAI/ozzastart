import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/auth-client';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await authClient.getSession();
    if (!sessionResponse?.data?.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { webhookUrl, secret } = body;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
    }

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Ozza',
        userId: sessionResponse.data.session.userId,
        testId: crypto.randomUUID()
      }
    };

    // Create signature if secret is provided
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Ozza-Webhook/1.0'
    };

    if (secret) {
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(testPayload))
        .digest('hex');
      headers['X-Ozza-Signature'] = `sha256=${signature}`;
    }

    // Send test webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseText = await response.text();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseText.substring(0, 500), // Limit response size
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing webhook:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json({ 
          success: false, 
          error: 'Webhook request timed out' 
        }, { status: 408 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Unknown error occurred' 
    }, { status: 500 });
  }
}
