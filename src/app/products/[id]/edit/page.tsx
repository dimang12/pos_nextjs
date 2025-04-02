'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Product, ProductImage } from '@/types/product';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'sonner';
import Breadcrumb from '@/components/Breadcrumb';

interface EditProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: File[];
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EditProductFormData>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    images: [],
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const data = await response.json();
        setProduct(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          price: data.price,
          stock: data.stock,
          category: data.category || '',
          images: [],
        });
        setPreviewImages(data.images.map((img: ProductImage) => img.url));
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to fetch product');
      } finally {
        setIsLoadingProduct(false);
      }
    };

    if (isAuthenticated) {
      fetchProduct();
    }
  }, [isAuthenticated, params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files],
    }));

    // Create preview URLs for new images
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('stock', formData.stock.toString());
      formDataToSend.append('category', formData.category);
      formData.images.forEach(image => {
        formDataToSend.append('images', image);
      });

      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      toast.success('Product updated successfully');
      router.push('/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoadingProduct) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!product) {
    return <div className="flex items-center justify-center min-h-screen">Product not found</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Edit Product</Typography>
      </Box>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
              />
            </Grid>

            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
                inputProps={{ step: "0.01" }}
              />
            </Grid>

            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid xs={12}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Images</Typography>
              <Grid container spacing={2}>
                {previewImages.map((url, index) => (
                  <Grid xs={6} sm={4} md={3} key={index}>
                    <Box sx={{ position: 'relative' }}>
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <IconButton
                        onClick={() => removeImage(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' }
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Button
                variant="outlined"
                component="label"
                sx={{ mt: 2 }}
              >
                Add Images
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />
              </Button>
            </Grid>

            <Grid xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Product'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/products')}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
} 