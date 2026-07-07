import { useParams } from 'react-router-dom';
import AdminDiscountList from './AdminDiscountList';

export default function AdminStoreDiscountsPage() {
  const { id } = useParams();
  return <AdminDiscountList storeId={Number(id)} />;
}
