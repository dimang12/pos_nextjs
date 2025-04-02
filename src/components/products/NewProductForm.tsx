'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface NewProductFormProps {
  onSubmit: (product: {
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    images: File[];
  }) => Promise<void>;
  onClose: () => void;
}

export default function NewProductForm({ onSubmit, onClose }: NewProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));

    setImages(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await onSubmit({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        images,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Add New Product
      </Typography>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Stack spacing={3}>
        <TextField
          label="Product Name"
          required
          fullWidth
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <TextField
          label="Description"
          multiline
          rows={3}
          fullWidth
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <TextField
          label="Price"
          type="number"
          required
          fullWidth
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        />

        <TextField
          label="Stock"
          type="number"
          required
          fullWidth
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
        />

        <FormControl fullWidth required>
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category}
            label="Category"
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <MenuItem value="electronics">Electronics</MenuItem>
            <MenuItem value="clothing">Clothing</MenuItem>
            <MenuItem value="food">Food</MenuItem>
            <MenuItem value="beverages">Beverages</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Product Images
          </Typography>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            Add Images
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>

          {previewUrls.length > 0 && (
            <ImageList cols={3} rowHeight={164} sx={{ maxHeight: 450 }}>
              {previewUrls.map((url, index) => (
                <ImageListItem key={url}>
                  <img
                    src={url}
                    alt={`Product preview ${index + 1}`}
                    loading="lazy"
                    style={{ height: '100%', objectFit: 'cover' }}
                  />
                  <ImageListItemBar
                    position="top"
                    actionIcon={
                      <IconButton
                        sx={{ color: 'white' }}
                        onClick={() => handleRemoveImage(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Create Product
          </Button>
        </Box>
      </Stack>
    </Box>
  );
} 