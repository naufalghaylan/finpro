import { useParams } from 'react-router-dom';
import AdminStockList from './AdminStockList';

export default function AdminStoreStocksPage() {
  const { id } = useParams();
  return <AdminStockList storeId={Number(id)} />;
}
