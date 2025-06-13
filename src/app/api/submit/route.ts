import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const READ_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Sheet2';

// Helper function to format private key
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) {
    console.error('Private key is undefined');
    return undefined;
  }
  try {
    // Remove any existing quotes and ensure proper line breaks
    const formattedKey = key
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\\n/g, '\n')       // Replace \n with actual line breaks
      .replace(/\n/g, '\\n');      // Convert back to \n for Vercel
    
    // Validate the key format
    if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('Invalid private key format: Missing BEGIN marker');
      return undefined;
    }
    if (!formattedKey.includes('-----END PRIVATE KEY-----')) {
      console.error('Invalid private key format: Missing END marker');
      return undefined;
    }
    
    return formattedKey;
  } catch (error) {
    console.error('Error formatting private key:', error);
    return undefined;
  }
}

// Function to check if a job number already exists
async function checkJobNumberExists(jobNumber: string) {
  try {
    const privateKey = formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    if (!privateKey) {
      throw new Error('Invalid private key format');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: READ_SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get all existing job numbers from the sheet
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
    // Validate environment variables
    if (!process.env.GOOGLE_SHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID is not configured');
    }
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error('GOOGLE_CLIENT_EMAIL is not configured');
    }
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('GOOGLE_PRIVATE_KEY is not configured');
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
    
    const privateKey = formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    if (!privateKey) {
      throw new Error('Invalid private key format');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: SCOPES,
    });

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

    // Append the data to the sheet
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
  } catch (error) {
    console.error('Error submitting job entry:', error);
    
    // Return a more detailed error message
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
