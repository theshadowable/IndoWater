import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiService, { Customer, Property } from '../../../services/apiService';
import { LoadingSpinner, ErrorMessage } from '../../../components/common';

interface CustomerFormParams {
  id?: string;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  property_id: string;
  unit: string;
  status: 'active' | 'inactive';
}

const CustomerForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<CustomerFormParams>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    property_id: '',
    unit: '',
    status: 'active'
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user data
        const userResponse = await apiService.auth.getUser();
        if (userResponse.success && userResponse.data) {
          setUserId(userResponse.data.id);
          
          // Fetch properties for dropdown
          const propertiesResponse = await apiService.properties.getAll({ 
            client_id: userResponse.data.id,
            limit: 100
          });
          
          if (propertiesResponse.success && propertiesResponse.data) {
            setProperties(propertiesResponse.data.data);
          }
          
          // If editing, fetch customer data
          if (isEdit && id) {
            const customerResponse = await apiService.customers.getById(id);
            if (customerResponse.success && customerResponse.data) {
              const customer = customerResponse.data;
              setFormData({
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                property_id: customer.property_id,
                unit: customer.unit,
                status: customer.status
              });
            } else {
              setError(customerResponse.message || t('customerForm.error.fetchCustomer', 'Failed to fetch customer data'));
            }
          }
        } else {
          setError(t('customerForm.error.fetchUser', 'Failed to fetch user data'));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(t('customerForm.error.fetchData', 'Failed to fetch data'));
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = t('customerForm.validation.nameRequired', 'Name is required');
    }
    
    if (!formData.email.trim()) {
      errors.email = t('customerForm.validation.emailRequired', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('customerForm.validation.emailInvalid', 'Please enter a valid email address');
    }
    
    if (!formData.phone.trim()) {
      errors.phone = t('customerForm.validation.phoneRequired', 'Phone is required');
    }
    
    if (!formData.property_id) {
      errors.property_id = t('customerForm.validation.propertyRequired', 'Property is required');
    }
    
    if (!formData.unit.trim()) {
      errors.unit = t('customerForm.validation.unitRequired', 'Unit is required');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const customerData = {
        ...formData,
        client_id: userId
      };
      
      let response;
      if (isEdit && id) {
        response = await apiService.customers.update(id, customerData);
      } else {
        response = await apiService.customers.create(customerData);
      }
      
      if (response.success) {
        navigate('/client/customers');
      } else {
        setError(response.message || t('customerForm.error.save', 'Failed to save customer'));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      setError(t('customerForm.error.save', 'Failed to save customer'));
      setLoading(false);
    }
  };

  if (loading && !formData.name) {
    return <LoadingSpinner />;
  }

  return (
    <div className="customer-form">
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
          {t('customerForm.backToCustomers', 'Back to Customers')}
        </Link>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit 
            ? t('customerForm.editTitle', 'Edit Customer')
            : t('customerForm.addTitle', 'Add New Customer')
          }
        </h1>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customerForm.name', 'Full Name')} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('customerForm.namePlaceholder', 'Enter customer full name')}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customerForm.email', 'Email Address')} *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('customerForm.emailPlaceholder', 'Enter email address')}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customerForm.phone', 'Phone Number')} *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('customerForm.phonePlaceholder', 'Enter phone number')}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="property_id" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customerForm.property', 'Property')} *
                </label>
                <select
                  id="property_id"
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.property_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{t('customerForm.selectProperty', 'Select a property')}</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.address}
                    </option>
                  ))}
                </select>
                {validationErrors.property_id && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.property_id}</p>
                )}
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customerForm.unit', 'Unit/Apartment Number')} *
                </label>
                <input
                  type="text"
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.unit ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('customerForm.unitPlaceholder', 'e.g., A-101, Unit 5, etc.')}
                />
                {validationErrors.unit && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.unit}</p>
                )}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customerForm.status', 'Status')}
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">{t('customerForm.statusActive', 'Active')}</option>
                  <option value="inactive">{t('customerForm.statusInactive', 'Inactive')}</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <Link
                to="/client/customers"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('customerForm.cancel', 'Cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isEdit 
                  ? t('customerForm.updateCustomer', 'Update Customer')
                  : t('customerForm.addCustomer', 'Add Customer')
                }
              </button>
            </div>
          </form>
        </div>

        {/* Help text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                {t('customerForm.helpTitle', 'Customer Information')}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('customerForm.helpName', 'Enter the customer\'s full legal name as it appears on official documents.')}</li>
                  <li>{t('customerForm.helpEmail', 'Provide a valid email address for billing notifications and communications.')}</li>
                  <li>{t('customerForm.helpPhone', 'Include the phone number for urgent notifications and meter reading confirmations.')}</li>
                  <li>{t('customerForm.helpProperty', 'Select the property where the customer resides or operates.')}</li>
                  <li>{t('customerForm.helpUnit', 'Specify the exact unit, apartment number, or location within the property.')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;