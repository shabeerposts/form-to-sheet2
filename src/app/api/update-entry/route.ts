import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Sheet2';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobNumber, field, value } = body;

    if (!jobNumber || !field || value === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: jobNumber, field, or value'
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

    // First, find the row with the matching job number
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`, // Column A contains job numbers
    });

    const jobNumbers = response.data.values || [];
    const rowIndex = jobNumbers.findIndex(row => row[0] === jobNumber);

    if (rowIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Job number not found'
        },
        { status: 404 }
      );
    }

    // Map field names to column letters
    const fieldToColumn: { [key: string]: string } = {
      jobNumber: 'A',
      customerName: 'B',
      jobName: 'C',
      jobLocation: 'D',
      jobSource: 'E',
      salesPerson: 'F',
      jobSize: 'G',
      quantity: 'H',
      jobCategory: 'I',
      jobBookedDate: 'J',
      jobStatus: 'K',
      deliveryDate: 'L',
      jobPrice: 'M',
      totalPrice: 'N',
      deliveryDetails: 'O',
      remark: 'P'
    };

    const column = fieldToColumn[field];
    if (!column) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid field name'
        },
        { status: 400 }
      );
    }

    // Update the specific cell
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${column}${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]]
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Entry updated successfully!'
    });
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update entry',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 