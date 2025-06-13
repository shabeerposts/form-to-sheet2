import { NextResponse } from 'next/server';
import { google } from 'googleapis';

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\n/g, '\\n');
}

export async function GET() {
  try {
    // Initialize the Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheet ID is not configured');
    }

    // Get all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet2!A:Q', // Adjust as needed for your sheet
    });

    const data = response.data.values || [];

    return NextResponse.json({ 
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch sheet data' 
      },
      { status: 500 }
    );
  }
}
