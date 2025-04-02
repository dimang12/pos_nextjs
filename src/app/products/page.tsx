'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, CardContent, CardMedia, Grid, Typography, Box, Drawer, IconButton, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Close as CloseIcon, GridView as GridViewIcon, ViewList as ViewListIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import NewProductForm from '@/components/products/NewProductForm';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  stock: number;
  category: string | null;
  images: Array<{
    id: number;
    url: string;
    isPrimary: boolean;
  }>;
}

type ViewMode = 'grid' | 'list';

export default function ProductsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
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

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      setProducts(products.filter(product => product.id !== productToDelete.id));
      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
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
          Products
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newView) => newView && setViewMode(newView)}
            size="small"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsDrawerOpen(true)}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={product.images?.[0]?.url || '/placeholder.png'}
                  alt={product.name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="h2">
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {product.description}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${Number(product.price).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stock: {product.stock}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      component={Link}
                      href={`/products/${product.id}/edit`}
                      startIcon={<EditIcon />}
                      variant="outlined"
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteClick(product)}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {products.map((product) => (
            <Card key={product.id}>
              <Box sx={{ display: 'flex', p: 2 }}>
                <CardMedia
                  component="img"
                  sx={{ width: 150, height: 150, objectFit: 'cover' }}
                  image={product.images?.[0]?.url || '/placeholder.png'}
                  alt={product.name}
                />
                <CardContent sx={{ flex: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {product.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      ${Number(product.price).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stock: {product.stock}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      component={Link}
                      href={`/products/${product.id}/edit`}
                      startIcon={<EditIcon />}
                      variant="outlined"
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteClick(product)}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <Box sx={{ width: 400, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Add New Product</Typography>
            <IconButton onClick={() => setIsDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <NewProductForm 
            onSubmit={async (productData) => {
              try {
                const formData = new FormData();
                formData.append('name', productData.name);
                formData.append('description', productData.description);
                formData.append('price', productData.price.toString());
                formData.append('stock', productData.stock.toString());
                formData.append('category', productData.category);
                productData.images.forEach(image => {
                  formData.append('images', image);
                });

                const response = await fetch('/api/products', {
                  method: 'POST',
                  body: formData,
                });

                if (!response.ok) {
                  throw new Error('Failed to create product');
                }

                toast.success('Product created successfully');
                setIsDrawerOpen(false);
                await fetchProducts();
              } catch (error) {
                console.error('Error creating product:', error);
                toast.error('Failed to create product');
                throw error;
              }
            }}
            onClose={() => setIsDrawerOpen(false)}
          />
        </Box>
      </Drawer>
    </Box>
  );
} 