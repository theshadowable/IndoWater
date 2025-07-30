import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import apiService, { Customer, Property } from '../../../services/apiService';
import { LoadingSpinner, ErrorMessage } from '../../../components/common';

const CustomerManagement: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterProperty, setFilterProperty] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const limit = 10;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await apiService.auth.getUser();
        if (userResponse.success && userResponse.data) {
          setUserId(userResponse.data.id);
          return userResponse.data.id;
        }
        return null;
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(t('customers.error.user', 'Failed to fetch user data'));
        return null;
      }
    };

    const fetchData = async (clientId: string) => {
      try {
        setLoading(true);
        
        // Fetch customers
        const params: any = {
          client_id: clientId,
          page: currentPage,
          limit,
        };
        
        if (filterStatus) params.status = filterStatus;
        if (filterProperty) params.property_id = filterProperty;
        if (searchTerm) params.search = searchTerm;
        
        const customersResponse = await apiService.customers.getAll(params);
        
        if (customersResponse.success && customersResponse.data) {
          setCustomers(customersResponse.data.data);
          setTotalCustomers(customersResponse.data.pagination.total);
        } else {
          setError(customersResponse.message || t('customers.error.fetch', 'Failed to fetch customers'));
        }
        
        // Fetch properties for filter dropdown
        const propertiesResponse = await apiService.properties.getAll({ 
          client_id: clientId,
          limit: 100 // Get all properties for dropdown
        });
        
        if (propertiesResponse.success && propertiesResponse.data) {
          setProperties(propertiesResponse.data.data);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(t('customers.error.fetch', 'Failed to fetch customers'));
        setLoading(false);
      }
    };

    const initData = async () => {
      const clientId = await fetchUserData();
      if (clientId) {
        await fetchData(clientId);
      }
    };

    initData();
  }, [t, currentPage, filterStatus, filterProperty, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddCustomer = () => {
    window.location.href = '/customers/add';
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (window.confirm(t('customers.confirmDelete', 'Are you sure you want to delete this customer?'))) {
      try {
        const response = await apiService.customers.delete(customerId);
        if (response.success) {
          // Refresh the customer list
          setCustomers(customers.filter(customer => customer.id !== customerId));
          setTotalCustomers(totalCustomers - 1);
        } else {
          setError(response.message || t('customers.error.delete', 'Failed to delete customer'));
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        setError(t('customers.error.delete', 'Failed to delete customer'));
      }
    }
  };

  const totalPages = Math.ceil(totalCustomers / limit);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="customer-management-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('dashboard.client.customerManagement.title', 'Customer Management')}</h1>
        <button
          onClick={handleAddCustomer}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          {t('customers.addCustomer', 'Add Customer')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder={t('customers.searchPlaceholder', 'Search customers...')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-2 text-gray-500 hover:text-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </form>

          <div className="flex gap-4">
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
            >
              <option value="">{t('customers.filterProperty', 'All Properties')}</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>

            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">{t('customers.filterStatus', 'All Status')}</option>
              <option value="active">{t('customers.statusActive', 'Active')}</option>
              <option value="inactive">{t('customers.statusInactive', 'Inactive')}</option>
            </select>
          </div>
        </div>
      </div>

      {customers.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customers.name', 'Name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customers.property', 'Property')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customers.unit', 'Unit')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customers.email', 'Email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customers.phone', 'Phone')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customers.status', 'Status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customers.createdAt', 'Created')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customers.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="text-blue-500 hover:underline font-medium"
                          >
                            {customer.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/properties/${customer.property_id}`}
                        className="text-blue-500 hover:underline"
                      >
                        {customer.property?.name || '-'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`mailto:${customer.email}`} className="text-gray-500 hover:text-gray-700">
                        {customer.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`tel:${customer.phone}`} className="text-gray-500 hover:text-gray-700">
                        {customer.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          customer.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="text-blue-500 hover:text-blue-700 mr-4"
                      >
                        {t('customers.view', 'View')}
                      </Link>
                      <Link
                        to={`/customers/${customer.id}/edit`}
                        className="text-indigo-500 hover:text-indigo-700 mr-4"
                      >
                        {t('customers.edit', 'Edit')}
                      </Link>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        {t('customers.delete', 'Delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('pagination.previous', 'Previous')}
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('pagination.next', 'Next')}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {t('pagination.showing', 'Showing')}{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * limit + 1}
                    </span>{' '}
                    {t('pagination.to', 'to')}{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * limit, totalCustomers)}
                    </span>{' '}
                    {t('pagination.of', 'of')}{' '}
                    <span className="font-medium">{totalCustomers}</span>{' '}
                    {t('pagination.results', 'results')}
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">{t('pagination.previous', 'Previous')}</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">{t('pagination.next', 'Next')}</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            {t('customers.noCustomers', 'No customers found')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t(
              'customers.noCustomersMessage',
              'Get started by adding a new customer.'
            )}
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddCustomer}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              {t('customers.addCustomer', 'Add Customer')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;