'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      const formattedProducts = data.map((product: Product) => ({
        ...product,
        price: Number(product.price),
        stock: Number(product.stock)
      }));
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
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
      fetchProducts();
    }
  }, [isAuthenticated]);

  const handleAddItem = () => {
    if (!selectedProduct || quantity < 1) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    if (quantity > product.stock) {
      toast.error('Not enough stock available');
      return;
    }

    const newItem: OrderItem = {
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: product.price,
      subtotal: product.price * quantity
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProduct('');
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: customerName,
          total_amount: orderItems.reduce((sum, item) => sum + item.subtotal, 0),
          payment_method: paymentMethod,
          items: orderItems,
        }),
      });

      if (!response.ok) throw new Error('Failed to create order');

      toast.success('Order created successfully');
      router.push('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb />
      <Typography variant="h4" component="h1" gutterBottom>
        New Order
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <TextField
                  fullWidth
                  label="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  margin="normal"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add Items
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={5}>
                    <FormControl fullWidth>
                      <InputLabel>Product</InputLabel>
                      <Select
                        value={selectedProduct}
                        label="Product"
                        onChange={(e) => setSelectedProduct(Number(e.target.value))}
                      >
                        {products.map((product) => (
                          <MenuItem key={product.id} value={product.id}>
                            {product.name} (${product.price.toFixed(2)})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddItem}
                      disabled={!selectedProduct || quantity < 1}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
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
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell align="right">${item.subtotal.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <IconButton onClick={() => handleRemoveItem(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <strong>Total Amount</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>
                            ${orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                          </strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/orders')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={orderItems.length === 0}
              >
                Create Order
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
} 