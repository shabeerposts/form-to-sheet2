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
      scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Use scope directly here
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
