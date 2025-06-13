import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const READ_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Sheet2';

// Function to check if a job number already exists
async function checkJobNumberExists(jobNumber: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: READ_SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get all existing job numbers from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`, // Column A contains job numbers
    });

    const jobNumbers = response.data.values || [];
    
    // Check if the job number exists (skip header row)
    return jobNumbers.slice(1).some(row => row[0] === jobNumber);
  } catch (error) {
    console.error('Error checking job number uniqueness:', error);
    throw error;
  }
}

// This is the API route that will handle form submissions
export async function POST(request: Request) {
  try {
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
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get the current date and time for submission tracking
    const submissionDate = new Date().toISOString();

    // Prepare the row data in the correct order matching the sheet columns
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
      range: `${SHEET_NAME}!A:O`, // Updated to include all columns including job source
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
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit job entry',
        error: error instanceof Error ? error.message : 'Unknown error' 
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
