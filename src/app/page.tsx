'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { readonly } from 'zod/v4';

type TabType = 'add' | 'view';

interface SheetRow {
  sno: string;
  jobNumber: string;
  customerName: string;
  jobName: string;
  jobLocation: string;
  jobSource: string;
  salesPerson: string;
  jobSize: string;
  quantity: string;
  jobCategory: string;
  jobBookedDate: string;
  jobStatus: string;
  deliveryDate: string;
  deliveryDetails: string;
  remark: string;
  jobPrice: string;
  totalPrice: string;
}

// Define form schema with specific fields
const formSchema = z.object({
  jobNumber: z.string().min(1, 'Job Number is required'),
  customerName: z.string().min(1, 'Customer Name is required'),
  jobName: z.string().min(1, 'Job Name is required'),
  jobLocation: z.string().min(1, 'Job Location is required'),
  jobSource: z.string().min(1, 'Job Source is required'),
  salesPerson: z.string().min(1, 'Sales Person is required'),
  jobSize: z.string().min(1, 'Job Size is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  jobCategory: z.string().min(1, 'Job Category is required'),
  jobBookedDate: z.string().min(1, 'Job Booked Date is required'),
  jobStatus: z.string().min(1, 'Job Status is required'),
  deliveryDate: z.string().min(1, 'Delivery Date is required'),
  jobPrice: z.string().min(1, 'Job Price is required'),
  totalPrice: z.string().min(1, 'Total Price is required'),
  deliveryDetails: z.string().min(1, 'Delivery Details are required'),
  remark: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('add');
  const [isLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [sheetData, setSheetData] = useState<SheetRow[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [jobPrefix, setJobPrefix] = useState('ROPR'); // Default prefix
  const [jobPrice, setJobPrice] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Initialize form with react-hook-form and zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Fetch sheet data
  const fetchSheetData = async () => {
    try {
      setIsFetchingData(true);
      const response = await fetch('/api/sheet-data');
      const data = await response.json();
      
      if (response.ok && data.data) {
        // Skip the header row and map the data
        const rows = data.data.slice(1).map((row: (string | number | boolean | null | undefined)[], index: number) => ({
          sno: (index + 1).toString(),
          jobNumber: row[0] || '',
          customerName: row[1] || '',
          jobName: row[2] || '',
          jobLocation: row[3] || '',
          jobSource: row[4] || '',
          salesPerson: row[5] || '',
          jobSize: row[6] || '',
          quantity: row[7] || '',
          jobCategory: row[8] || '',
          jobBookedDate: row[9] || '',
          jobStatus: row[10] || '',
          deliveryDate: row[11] || '',
          jobPrice: row[12] || '',
          totalPrice: row[13] || '',
          deliveryDetails: row[14] || '',
          remark: row[15] || ''
        }));
        setSheetData(rows);
      }
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      setSubmitStatus({
        success: false,
        message: 'Failed to load data. Please try again.'
      });
    } finally {
      setIsFetchingData(false);
    }
  };

  // Fetch data when view tab is active
  useEffect(() => {
    if (activeTab === 'view') {
      fetchSheetData();
    }
  }, [activeTab]);

  // Update totalPrice whenever jobPrice changes
  useEffect(() => {
    if (jobPrice && !isNaN(Number(jobPrice))) {
      const price = Number(jobPrice);
      const total = price + price * 0.05; // add 5% to job price
      setTotalPrice(total.toFixed(2));    // round to 2 decimal places
    } else {
      setTotalPrice('');
    }
  }, [jobPrice]);

  // Form fields configuration
  const formFields = [
    {
      id: 'jobNumber',
      label: 'Job Number',
      type: 'text',
      placeholder: 'Enter job number',
      required: true
    },
    {
      id: 'customerName',
      label: 'Customer Name',
      type: 'text',
      placeholder: 'Enter customer name',
      required: true
    },
    {
      id: 'jobName',
      label: 'Job Name',
      type: 'text',
      placeholder: 'Enter job name',
      required: true
    },
    {
      id: 'jobLocation',
      label: 'Job Location',
      type: 'text',
      placeholder: 'Enter job location',
      required: true
    },
    {
      id: 'jobSource',
      label: 'Job Source',
      type: 'text',
      placeholder: 'Enter job source',
      required: true
    },
    {
      id: 'salesPerson',
      label: 'Sales Person',
      type: 'text',
      placeholder: 'Enter sales person name',
      required: true
    },
    {
      id: 'jobSize',
      label: 'Job Size',
      type: 'text',
      placeholder: 'Enter job size',
      required: true
    },
    {
      id: 'quantity',
      label: 'Quantity',
      type: 'number',
      placeholder: 'Enter quantity',
      required: true
    },
    {
      id: 'jobCategory',
      label: 'Job Category',
      type: 'text',
      placeholder: 'Enter job category',
      required: true
    },
    {
      id: 'jobBookedDate',
      label: 'Job Booked Date',
      type: 'date',
      required: true
    },
    {
      id: 'jobStatus',
      label: 'Job Status',
      type: 'select',
      options: ['Pending', 'Waiting for Approval', 'In Progress', 'Completed', 'Delivered'],
      required: true
    },
    {
      id: 'deliveryDate',
      label: 'Delivery Date',
      type: 'date',
      required: true
    },
    {
      id: 'jobPrice',
      label: 'Job Price',
      type: 'number',
      placeholder: 'Enter job price',
      required: true
    },
    {
      id: 'totalPrice',
      label: 'Total Price (5% of Job Price)',
      type: 'number',
      placeholder: 'Auto-calculated',
      readonly:true
    },
    {
      id: 'deliveryDetails',
      label: 'Delivery Details',
      type: 'textarea',
      placeholder: 'Enter delivery details',
      required: true
    },
    {
      id: 'remark',
      label: 'Remark',
      type: 'textarea',
      placeholder: 'Any additional remarks',
      required: false
    }
  ];

  // Handle form submission
  const onSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      // Combine prefix and job number
      const fullJobNumber = `${jobPrefix}${formData.jobNumber}`;

      // Format dates to YYYY-MM-DD format for consistency
      const formattedData = {
        ...formData,
        jobNumber: fullJobNumber, // Use the combined job number
        jobPrice: jobPrice,
        totalPrice: totalPrice,
        jobBookedDate: formData.jobBookedDate ? new Date(formData.jobBookedDate).toISOString().split('T')[0] : '',
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate).toISOString().split('T')[0] : ''
      };

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit job entry');
      }
      
      setSubmitStatus({
        success: true,
        message: result.message || 'Job entry submitted successfully!'
      });
      
      // Reset form after successful submission
      reset();
      
      // If we're on the view tab, refresh the data
      if (activeTab === 'view') {
        fetchSheetData();
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error submitting job entry:', error);
      setSubmitStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit job entry. Please try again.'
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this new function to handle status updates
  const handleStatusUpdate = async (jobNumber: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/update-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobNumber,
          field: 'jobStatus',
          value: newStatus
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update status');
      }

      // Refresh the data after successful update
      await fetchSheetData();
      setEditingStatus(null);

      // Show success message
      setSubmitStatus({
        success: true,
        message: 'Status updated successfully!'
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    } catch (error) {
      console.error('Error updating status:', error);
      setSubmitStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update status'
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    } finally {
      setIsUpdating(false);
    }
  };

  // First, let's create a helper function to get status colors (add this near the top of your component)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Delivered':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-red-100 text-red-800';
      case 'Waiting for Approval':
        return 'bg-purple-100 text-purple-800';  // Added new color for Waiting for Approval
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 py-8 px-3 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-4 sm:p-6 md:p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Job Tracker
          </h1>
          <p className="text-gray-600">Efficiently manage and track your job entries</p>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 sm:mb-8">
          <nav className="-mb-px flex w-full justify-center sm:justify-start space-x-2 sm:space-x-8">
            <button
              onClick={() => setActiveTab('add')}
              className={`${activeTab === 'add' 
                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'} 
                whitespace-nowrap py-3 px-3 sm:py-4 sm:px-6 border-b-2 font-medium text-xs sm:text-sm rounded-t-lg transition-all duration-200 flex items-center flex-1 sm:flex-none justify-center sm:justify-start`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Entry
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`${activeTab === 'view' 
                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'} 
                whitespace-nowrap py-3 px-3 sm:py-4 sm:px-6 border-b-2 font-medium text-xs sm:text-sm rounded-t-lg transition-all duration-200 flex items-center flex-1 sm:flex-none justify-center sm:justify-start`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              View Entries
            </button>
          </nav>
        </div>

        {/* Toast Notification */}
        {submitStatus && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
            <div 
              className={`${submitStatus.success ? 'bg-green-500' : 'bg-red-500'} 
                rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 ease-in-out animate-enter`}
              style={{animation: 'slideIn 0.3s ease-out forwards'}}
            >
              <div className="p-4 flex items-start">
                <div className="flex-shrink-0">
                  {submitStatus.success ? (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-white">
                    {submitStatus.success ? 'Success!' : 'Error!'}
                  </p>
                  <p className="mt-1 text-sm text-white opacity-90">
                    {submitStatus.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="inline-flex text-white focus:outline-none focus:text-gray-200 rounded-md"
                    onClick={() => setSubmitStatus(null)}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'add' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center text-blue-700 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Fill in the job details below. All fields marked with an asterisk (*) are required.</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {formFields.map((field) => (
              <div 
                key={field.id} 
                className={`col-span-1 ${field.id === 'deliveryDetails' || field.id === 'remark' ? 'md:col-span-2 lg:col-span-3 mb-2' : ''}`}
              >
                <label 
                  htmlFor={field.id} 
                  className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                >
                  {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                  {field.id === 'jobNumber' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      ID
                    </span>
                  )}
                  {field.id === 'jobStatus' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Status
                    </span>
                  )}
                </label>
                {field.id === 'jobNumber' ? (
                  <div className="flex">
                    {/* Prefix dropdown before job number input */}
                    <select
                      value={jobPrefix}
                      onChange={e => setJobPrefix(e.target.value)}
                      className="mr-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
                      style={{ height: '48px', padding: '0 12px' }}
                      disabled={isSubmitting}
                    >
                      <option value="ROPR">ROPR</option>
                      <option value="DIGFI">DIGFI</option>
                    </select>
                    <input
                      type="text"
                      id={field.id}
                      {...register(field.id as keyof FormData)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black placeholder-gray-600 ${errors[field.id as keyof typeof errors] ? 'border-red-300' : ''}`}
                      placeholder={field.placeholder}
                      disabled={isSubmitting}
                      style={{ height: '48px', padding: '0 12px' }}
                    />
                  </div>
                ) : field.id === 'jobPrice' ? (
                  <input
                    type="number"
                    id={field.id}
                    {...register(field.id as keyof FormData)}
                    value={jobPrice}
                    onChange={e => setJobPrice(e.target.value)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black placeholder-gray-600 ${errors[field.id as keyof typeof errors] ? 'border-red-300' : ''}`}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                    style={{ height: '48px', padding: '0 12px' }}
                  />
                ) : field.id === 'totalPrice' ? (
                  <input
                    type="number"
                    id={field.id}
                    {...register(field.id as keyof FormData)}
                    value={totalPrice}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm text-black"
                    placeholder={field.placeholder}
                    style={{ height: '48px', padding: '0 12px' }}
                    tabIndex={-1}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    {...register(field.id as keyof FormData)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black placeholder-gray-600 ${errors[field.id as keyof typeof errors] ? 'border-red-300' : ''}`}
                    placeholder={field.placeholder}
                    rows={4}
                    disabled={isSubmitting}
                    style={{ minHeight: '120px', padding: '12px', resize: 'vertical', lineHeight: '1.5' }}
                  />
                ) : field.type === 'select' && field.options ? (
                  <select
                    id={field.id}
                    {...register(field.id as keyof FormData)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black ${errors[field.id as keyof typeof errors] ? 'border-red-300' : ''}`}
                    disabled={isSubmitting}
                    style={{ height: '48px'}}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    id={field.id}
                    {...register(field.id as keyof FormData)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black placeholder-gray-600 ${errors[field.id as keyof typeof errors] ? 'border-red-300' : ''}`}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                    style={{ height: '48px', padding: '0 12px' }}
                  />
                )}
                {errors[field.id as keyof typeof errors] && (
                  <p className="mt-1 text-sm text-red-600">
                    {String(errors[field.id as keyof typeof errors]?.message)}
                  </p>
                )}
              </div>
            ))}
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => reset()}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Entry
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            {isFetchingData ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-6 text-gray-600 font-medium">Loading job data...</p>
              </div>
            ) : sheetData.length > 0 ? (
              <div className="shadow-lg overflow-hidden border border-gray-200 sm:rounded-lg bg-white">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Job Entries ({sheetData.filter(row => statusFilter === 'all' || row.jobStatus === statusFilter).length})
                    </h3>
                    <div className="flex items-center space-x-2">
                      <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
                        Filter by Status:
                      </label>
                      <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Pending" className="text-red-800">Pending</option>
                        <option value="Waiting for Approval" className="text-purple-800">Waiting for Approval</option>
                        <option value="In Progress" className="text-yellow-800">In Progress</option>
                        <option value="Completed" className="text-green-800">Completed</option>
                        <option value="Delivered" className="text-blue-800">Delivered</option>
                      </select>
                      {statusFilter !== 'all' && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(statusFilter)}`}>
                          {statusFilter}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      fetchSheetData();
                      setStatusFilter('all'); // Reset filter when refreshing
                    }} 
                    className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Number
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Name
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales Person
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booked Date
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Date
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Price
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Price
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Details
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sheetData
                      .filter(row => statusFilter === 'all' || row.jobStatus === statusFilter)
                      .map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>                        
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{row.sno}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{row.jobNumber}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{row.customerName}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{row.jobName}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{row.jobLocation}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{row.jobSource}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{row.salesPerson}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{row.jobSize}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{row.quantity}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{row.jobCategory}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.jobBookedDate ? new Date(row.jobBookedDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            {editingStatus === row.jobNumber ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={row.jobStatus}
                                  onChange={(e) => handleStatusUpdate(row.jobNumber, e.target.value)}
                                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  disabled={isUpdating}
                                >
                                  <option value="Pending" className="text-red-800">Pending</option>
                                  <option value="Waiting for Approval" className="text-purple-800">Waiting for Approval</option>
                                  <option value="In Progress" className="text-yellow-800">In Progress</option>
                                  <option value="Completed" className="text-green-800">Completed</option>
                                  <option value="Delivered" className="text-blue-800">Delivered</option>
                                </select>
                                {isUpdating && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                                )}
                              </div>
                            ) : (
                              <div 
                                className="flex items-center space-x-2 cursor-pointer"
                                onClick={() => setEditingStatus(row.jobNumber)}
                              >
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.jobStatus)}`}>
                                  {row.jobStatus}
                                </span>
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4 text-gray-400 hover:text-gray-600" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                                  />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">{row.jobPrice}</td>
                          <td className="px-3 py-4 text-sm text-gray-500">{row.totalPrice}</td>
                          <td className="px-3 py-4 text-sm text-gray-500 max-w-xs">
                            <div className="line-clamp-2 whitespace-normal break-words">{row.deliveryDetails}</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 max-w-xs">
                            <div className="line-clamp-2 whitespace-normal break-words">{row.remark || '-'}</div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 text-lg">No job entries available yet</p>
                <p className="text-gray-400 mt-2">Add your first entry using the &quot;Add New Entry&quot; tab</p>
                <button 
                  onClick={() => setActiveTab('add')} 
                  className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Entry
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}