import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiService, { Customer, ConsumptionRecord, Payment } from '../../../services/apiService';
import { LoadingSpinner, ErrorMessage } from '../../../components/common';

interface CustomerParams {
  id: string;
}

const CustomerDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<CustomerParams>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionRecord[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'consumption' | 'payments' | 'meter'>('overview');

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        
        // Fetch customer details
        const customerResponse = await apiService.customers.getById(id);
        
        if (customerResponse.success && customerResponse.data) {
          setCustomer(customerResponse.data);
          
          // Fetch consumption history
          const consumptionResponse = await apiService.customers.getConsumption(id);
          if (consumptionResponse.success && consumptionResponse.data) {
            setConsumptionHistory(consumptionResponse.data);
          }
          
          // Fetch payment history
          const paymentsResponse = await apiService.customers.getPayments(id);
          if (paymentsResponse.success && paymentsResponse.data) {
            setPaymentHistory(paymentsResponse.data);
          }
        } else {
          setError(customerResponse.message || t('customerDetail.error.fetch', 'Failed to fetch customer details'));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        setError(t('customerDetail.error.fetch', 'Failed to fetch customer details'));
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [id, t]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!customer) {
    return <ErrorMessage message={t('customerDetail.error.notFound', 'Customer not found')} />;
  }

  return (
    <div className="customer-detail">
      <div className="mb-6">
        <Link to="/client/customers" className="text-blue-500 hover:underline flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          {t('customerDetail.backToCustomers', 'Back to Customers')}
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-16 w-16">
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xl font-medium text-gray-700">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-gray-500">{customer.email}</p>
            <p className="text-gray-500">{customer.phone}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/customers/${customer.id}/edit`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {t('customerDetail.edit', 'Edit Customer')}
          </Link>
          <Link
            to={`/meters/${customer.meter_id}`}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            {t('customerDetail.viewMeter', 'View Meter')}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('customerDetail.tabs.overview', 'Overview')}
            </button>
            <button
              onClick={() => setActiveTab('consumption')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'consumption'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('customerDetail.tabs.consumption', 'Consumption')} ({consumptionHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('customerDetail.tabs.payments', 'Payments')} ({paymentHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('meter')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'meter'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('customerDetail.tabs.meter', 'Meter Info')}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">{t('customerDetail.customerInfo', 'Customer Information')}</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">{t('customerDetail.property', 'Property')}</p>
                        <p className="font-medium">
                          <Link
                            to={`/properties/${customer.property_id}`}
                            className="text-blue-500 hover:underline"
                          >
                            {customer.property?.name || '-'}
                          </Link>
                        </p>
                        {customer.property?.address && (
                          <p className="text-sm text-gray-500">{customer.property.address}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t('customerDetail.unit', 'Unit')}</p>
                        <p className="font-medium">{customer.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t('customerDetail.status', 'Status')}</p>
                        <p className="font-medium">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              customer.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {customer.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t('customerDetail.createdAt', 'Created At')}</p>
                        <p className="font-medium">{formatDate(customer.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">{t('customerDetail.quickStats', 'Quick Stats')}</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-500">{t('customerDetail.totalConsumption', 'Total Consumption')}</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {consumptionHistory.reduce((total, record) => total + record.consumption, 0)} m³
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-500">{t('customerDetail.totalPaid', 'Total Paid')}</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(
                          paymentHistory
                            .filter(payment => payment.status === 'completed')
                            .reduce((total, payment) => total + payment.amount, 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-red-500">{t('customerDetail.outstandingBalance', 'Outstanding Balance')}</p>
                      <p className="text-2xl font-bold text-red-700">
                        {formatCurrency(
                          paymentHistory
                            .filter(payment => payment.status === 'pending')
                            .reduce((total, payment) => total + payment.amount, 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-500">{t('customerDetail.lastReading', 'Last Reading')}</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {consumptionHistory.length > 0 
                          ? `${consumptionHistory[0].reading_value} m³`
                          : '-'
                        }
                      </p>
                      {consumptionHistory.length > 0 && (
                        <p className="text-sm text-purple-500">
                          {formatDate(consumptionHistory[0].reading_date)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'consumption' && (
            <div className="consumption-tab">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{t('customerDetail.consumptionHistory', 'Consumption History')}</h2>
                <Link
                  to={`/meters/${customer.meter_id}/readings/add`}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  {t('customerDetail.addReading', 'Add Reading')}
                </Link>
              </div>

              {consumptionHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.period', 'Period')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.readingDate', 'Reading Date')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.readingValue', 'Reading Value')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.consumption', 'Consumption')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.amount', 'Amount')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.status', 'Status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {consumptionHistory.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.month} {record.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDate(record.reading_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.reading_value} m³
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {record.consumption} m³
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {formatCurrency(record.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                record.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'unpaid'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 text-center rounded-lg">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    {t('customerDetail.noConsumption', 'No consumption records found')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t(
                      'customerDetail.noConsumptionMessage',
                      'Consumption records will appear here once meter readings are submitted.'
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="payments-tab">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{t('customerDetail.paymentHistory', 'Payment History')}</h2>
                <Link
                  to={`/payments/create?customer_id=${customer.id}`}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  {t('customerDetail.createInvoice', 'Create Invoice')}
                </Link>
              </div>

              {paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.invoiceNumber', 'Invoice Number')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.period', 'Period')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.amount', 'Amount')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.dueDate', 'Due Date')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.paymentDate', 'Payment Date')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.status', 'Status')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('customerDetail.actions', 'Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/payments/${payment.id}`}
                              className="text-blue-500 hover:underline font-medium"
                            >
                              {payment.invoice_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {payment.period}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDate(payment.due_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                payment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/payments/${payment.id}`}
                              className="text-blue-500 hover:text-blue-700 mr-4"
                            >
                              {t('customerDetail.view', 'View')}
                            </Link>
                            {payment.status === 'pending' && (
                              <Link
                                to={`/payments/${payment.id}/process`}
                                className="text-green-500 hover:text-green-700"
                              >
                                {t('customerDetail.process', 'Process')}
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 text-center rounded-lg">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    {t('customerDetail.noPayments', 'No payment records found')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t(
                      'customerDetail.noPaymentsMessage',
                      'Payment records will appear here once invoices are created and processed.'
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'meter' && (
            <div className="meter-tab">
              <h2 className="text-lg font-semibold mb-4">{t('customerDetail.meterInformation', 'Meter Information')}</h2>
              
              {customer.meter ? (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-md font-medium mb-3">{t('customerDetail.meterDetails', 'Meter Details')}</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">{t('customerDetail.serialNumber', 'Serial Number')}</p>
                          <p className="font-medium">{customer.meter.serial_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t('customerDetail.installationDate', 'Installation Date')}</p>
                          <p className="font-medium">{formatDate(customer.meter.installation_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t('customerDetail.lastReadingDate', 'Last Reading Date')}</p>
                          <p className="font-medium">
                            {customer.meter.last_reading_date 
                              ? formatDate(customer.meter.last_reading_date)
                              : t('customerDetail.noReadings', 'No readings yet')
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t('customerDetail.lastReadingValue', 'Last Reading Value')}</p>
                          <p className="font-medium">{customer.meter.last_reading_value} m³</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t('customerDetail.meterStatus', 'Meter Status')}</p>
                          <p className="font-medium">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                customer.meter.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {customer.meter.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium mb-3">{t('customerDetail.meterActions', 'Meter Actions')}</h3>
                      <div className="space-y-3">
                        <Link
                          to={`/meters/${customer.meter_id}`}
                          className="block w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center"
                        >
                          {t('customerDetail.viewMeterDetails', 'View Meter Details')}
                        </Link>
                        <Link
                          to={`/meters/${customer.meter_id}/readings/add`}
                          className="block w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-center"
                        >
                          {t('customerDetail.submitReading', 'Submit Reading')}
                        </Link>
                        <Link
                          to={`/meters/${customer.meter_id}/readings`}
                          className="block w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-center"
                        >
                          {t('customerDetail.viewReadings', 'View All Readings')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 text-center rounded-lg">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    {t('customerDetail.noMeter', 'No meter assigned')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t(
                      'customerDetail.noMeterMessage',
                      'This customer does not have a water meter assigned yet.'
                    )}
                  </p>
                  <div className="mt-6">
                    <Link
                      to={`/meters/assign?customer_id=${customer.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {t('customerDetail.assignMeter', 'Assign Meter')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;