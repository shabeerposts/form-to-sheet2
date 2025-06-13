import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Sheet2';

// Helper function to format private key
function getPrivateKey() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('GOOGLE_PRIVATE_KEY is not configured');
  }
  
  try {
    // Log the first few characters of the key for debugging (safely)
    console.log('Private key starts with:', privateKey.substring(0, 20) + '...');
    
    return privateKey
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\\n/g, '\n');      // Replace \n with actual line breaks
  } catch (error) {
    console.error('Error formatting private key:', error);
    throw error;
  }
}

export async function GET() {
  try {
    console.log('Starting sheet data fetch');
    
    // Initialize the Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: getPrivateKey(),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    console.log('Auth object created successfully');

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheet ID is not configured');
    }

    console.log('Attempting to fetch data from sheet:', spreadsheetId);

    // Get all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet2!A:Q',
    });

    console.log('Data fetched successfully');

    const data = response.data.values || [];

    return NextResponse.json({ 
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Detailed error in sheet-data:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch sheet data',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
