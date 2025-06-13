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
  
  return privateKey
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/\\n/g, '\n');      // Replace \n with actual line breaks
}

// Add OPTIONS method to handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Make sure GET method is properly exported
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

// Make sure POST method is properly exported
export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!SPREADSHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID is not configured');
    }
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error('GOOGLE_CLIENT_EMAIL is not configured');
    }

    const body = await request.json();
    console.log('Received request body:', { ...body, jobNumber: body.jobNumber });
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: getPrivateKey(),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    console.log('Auth object created successfully');

    const sheets = google.sheets({ version: 'v4', auth });
    const rowData = [
      body.jobNumber,
      body.customerName,
      body.jobName,
      body.jobLocation,
      body.jobSource,
      body.salesPerson,
      body.jobSize,
      body.quantity,
      body.jobCategory,
      body.jobBookedDate,
      body.jobStatus,
      body.deliveryDate,
      body.jobPrice,
      body.totalPrice,
      body.deliveryDetails,
      body.remark || '',
    ];

    console.log('Attempting to append data to sheet:', SPREADSHEET_ID);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:P`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    console.log('Data appended successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Job entry submitted successfully!',
      data: response.data 
    });
  } catch (error) {
    console.error('Detailed error in submit:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit job entry',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
