import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type Product = {
  _id: string;
  name: string;
  sku?: string;
  category?: string;
  supplier?: string;
  price?: number;
  stock?: number;
};

const fetchProducts = async (): Promise<Product[]> => {
  const res = await api.get('/products');
  return res.data;
};

export const useProducts = () => {
  return useQuery(['products'], fetchProducts, {
    refetchInterval: 5000,
    retry: 1,
    staleTime: 5000
  });
};

export default useProducts;
