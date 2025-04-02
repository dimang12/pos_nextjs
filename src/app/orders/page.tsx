'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Visibility as VisibilityIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method: 'cash' | 'card' | 'other';
  created_at: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      const formattedOrders = data.map((order: Order) => ({
        ...order,
        total_amount: Number(order.total_amount),
        items: order.items || []
      }));
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'processing':
        return 'info';
      default:
        return 'warning';
    }
  };

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!selectedOrder) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: newStatus }
          : order
      ));
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="info"
              startIcon={<LocalShippingIcon />}
              onClick={() => handleStatusChange('processing')}
              disabled={updatingStatus}
            >
              Process Delivery
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => handleStatusChange('cancelled')}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
          </Stack>
        );
      case 'processing':
        return (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleStatusChange('completed')}
              disabled={updatingStatus}
            >
              Complete
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => handleStatusChange('cancelled')}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
          </Stack>
        );
      case 'completed':
        return (
          <Button
            variant="contained"
            color="info"
            startIcon={<RefreshIcon />}
            onClick={() => handleStatusChange('pending')}
            disabled={updatingStatus}
          >
            Reset to Pending
          </Button>
        );
      case 'cancelled':
        return (
          <Button
            variant="contained"
            color="info"
            startIcon={<RefreshIcon />}
            onClick={() => handleStatusChange('pending')}
            disabled={updatingStatus}
          >
            Reset to Pending
          </Button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/orders/new')}
        >
          New Order
        </Button>
      </Box>

      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} key={order.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Order #{order.order_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customer: {order.customer_name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {new Date(order.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" color="primary">
                      ${order.total_amount.toFixed(2)}
                    </Typography>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                    <IconButton onClick={() => handleViewOrder(order)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              Order Details - #{selectedOrder.order_number}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Customer Information
                </Typography>
                <Typography variant="body2">
                  Name: {selectedOrder.customer_name || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Date: {new Date(selectedOrder.created_at).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Payment Method: {selectedOrder.payment_method}
                </Typography>
                <Typography variant="body2">
                  Status: <Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status)} size="small" />
                </Typography>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell align="right">${item.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <strong>Total Amount</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>${selectedOrder.total_amount.toFixed(2)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              {getStatusActions(selectedOrder)}
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
} 