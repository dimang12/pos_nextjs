'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';

interface SalesReport {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
    total_revenue: number;
  }>;
  sales_by_date: Array<{
    date: string;
    total_sales: number;
    order_count: number;
  }>;
}

interface CustomerReport {
  total_customers: number;
  new_customers: number;
  top_customers: Array<{
    customer_name: string;
    total_orders: number;
    total_spent: number;
  }>;
}

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${reportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      if (reportType === 'sales') {
        setSalesReport(data);
      } else {
        setCustomerReport(data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb />
      <Typography variant="h4" component="h1" gutterBottom>
        Reports
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="sales">Sales Report</MenuItem>
                  <MenuItem value="customers">Customer Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={generateReport}
                disabled={generating}
              >
                {generating ? <CircularProgress size={24} /> : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {reportType === 'sales' && salesReport && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Typography variant="body1">
                  Total Sales: ${salesReport.total_sales.toFixed(2)}
                </Typography>
                <Typography variant="body1">
                  Total Orders: {salesReport.total_orders}
                </Typography>
                <Typography variant="body1">
                  Average Order Value: ${salesReport.average_order_value.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Products
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity Sold</TableCell>
                        <TableCell align="right">Total Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesReport.top_products.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>{product.product_name}</TableCell>
                          <TableCell align="right">{product.quantity_sold}</TableCell>
                          <TableCell align="right">${product.total_revenue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Sales
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Orders</TableCell>
                        <TableCell align="right">Total Sales</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesReport.sales_by_date.map((day, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                          <TableCell align="right">{day.order_count}</TableCell>
                          <TableCell align="right">${day.total_sales.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {reportType === 'customers' && customerReport && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Summary
                </Typography>
                <Typography variant="body1">
                  Total Customers: {customerReport.total_customers}
                </Typography>
                <Typography variant="body1">
                  New Customers: {customerReport.new_customers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Customers
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Total Orders</TableCell>
                        <TableCell align="right">Total Spent</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerReport.top_customers.map((customer, index) => (
                        <TableRow key={index}>
                          <TableCell>{customer.customer_name}</TableCell>
                          <TableCell align="right">{customer.total_orders}</TableCell>
                          <TableCell align="right">${customer.total_spent.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
} 