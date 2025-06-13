import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Sheet2';

// Helper function to format private key
function getPrivateKey() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey) {
    console.error('GOOGLE_PRIVATE_KEY is missing');
    throw new Error('GOOGLE_PRIVATE_KEY is not configured');
  }
  
  try {
    // Only replace \n with actual line breaks, don't convert back
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    
    // Log the format check (safely)
    console.log('Private key format check:', {
      hasBeginMarker: formattedKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasEndMarker: formattedKey.includes('-----END PRIVATE KEY-----'),
      length: formattedKey.length,
      firstChars: formattedKey.substring(0, 20),
      lastChars: formattedKey.substring(formattedKey.length - 20)
    });
    
    return formattedKey;
  } catch (error) {
    console.error('Error formatting private key:', error);
    throw error;
  }
}

// Function to check if a job number already exists
async function checkJobNumberExists(jobNumber: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: getPrivateKey(),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const jobNumbers = response.data.values || [];
    return jobNumbers.slice(1).some(row => row[0] === jobNumber);
  } catch (error) {
    console.error('Error checking job number uniqueness:', error);
    throw error;
  }
}

// This is the API route that will handle form submissions
export async function POST(request: Request) {
  try {
    // Log environment variables (safely)
    console.log('Environment check:', {
      hasSheetId: !!SPREADSHEET_ID,
      hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      sheetName: SHEET_NAME
    });

    // Validate environment variables
    if (!SPREADSHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID is not configured');
    }
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error('GOOGLE_CLIENT_EMAIL is not configured');
    }

    const body = await request.json();
    
    // Check if the job number already exists
    const jobNumberExists = await checkJobNumberExists(body.jobNumber);
    if (jobNumberExists) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Job number already exists. Please use a unique job number.'
        },
        { status: 400 }
      );
    }
    
    try {
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

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:P`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Job entry submitted successfully!',
        data: response.data 
      });
    } catch (googleError) {
      console.error('Google Sheets API Error:', {
        name: googleError instanceof Error ? googleError.name : 'Unknown',
        message: googleError instanceof Error ? googleError.message : 'Unknown error',
        stack: googleError instanceof Error ? googleError.stack : undefined,
      });
      throw googleError;
    }
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

// Add a GET endpoint to check if the API is working
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Form submission API is working' 
  });
}
