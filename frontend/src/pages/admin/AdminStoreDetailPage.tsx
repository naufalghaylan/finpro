import { useEffect, useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CircleCheck,
  CircleX,
  ClipboardList,
  Info,
  Loader2,
  MapPin,
  Package,
  Phone,
  Radar,
  Repeat2,
  Tag,
  Users,
} from 'lucide-react'
import { getStoreById, updateStore } from '../../api/store'
import { AdminStoreDetailsForm, type StoreDetailFormData } from '../../components/admin/AdminStoreDetailsForm'
import { useToast } from '../../components/common/Toast'
import type { Store } from '../../types/store'
import ErrorPage from '../error/ErrorPage'
import AdminDiscountList from './AdminDiscountList'
import AdminOrderList from './AdminOrderList'
import AdminStockList from './AdminStockList'
import AdminStoreFulfillmentPage from './AdminStoreFulfillmentPage'

type StoreDetailTabKey = 'details' | 'stocks' | 'discounts' | 'orders' | 'fulfillment'

const fallbackPosition: [number, number] = [-6.2088, 106.8456]

export default function AdminStoreDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<StoreDetailTabKey>('details')
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState<{message: string, code: number} | null>(null)
  const [formData, setFormData] = useState<StoreDetailFormData>({
    name: '',
    address: '',
    phone: '',
    description: '',
    latitude: fallbackPosition[0],
    longitude: fallbackPosition[1],
    serviceRadius: 50,
  })
  const [position, setPosition] = useState<[number, number]>(fallbackPosition)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData((currentFormData) => ({
      ...currentFormData,
      latitude: position[0],
      longitude: position[1],
    }))
  }, [position])

  const fetchStore = async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const response = await getStoreById(Number(id))
      const storeData = response.data
      const nextPosition: [number, number] = [
        storeData.latitude || fallbackPosition[0],
        storeData.longitude || fallbackPosition[1],
      ]

      setStore(storeData)
      setFormData({
        name: storeData.name,
        address: storeData.address,
        phone: storeData.phone || '',
        description: storeData.description || '',
        latitude: nextPosition[0],
        longitude: nextPosition[1],
        serviceRadius: storeData.serviceRadius || 50,
      })
      setPosition(nextPosition)
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>
      setFetchError({
        message: error.response?.data?.message || 'Gagal mengambil data toko',
        code: error.response?.status || 500
      })
      showToast(error.response?.data?.message || 'Gagal mengambil data toko', 'error')
      // Only redirect if unauthorized for the entire stores section, otherwise show error
      if (error.response?.status === 403) navigate('/admin/stores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleUpdateStore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      setSaving(true)
      await updateStore(Number(id), formData)
      showToast('Detail toko berhasil diperbarui', 'success')
      await fetchStore()
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>
      showToast(error.response?.data?.message || 'Gagal memperbarui toko', 'error')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { key: StoreDetailTabKey; label: string; icon: typeof Info }[] = [
    { key: 'details', label: 'Detail Toko', icon: Info },
    { key: 'stocks', label: 'Manajemen Stok', icon: Package },
    { key: 'discounts', label: 'Manajemen Diskon', icon: Tag },
    { key: 'orders', label: 'Pesanan Toko', icon: ClipboardList },
    { key: 'fulfillment', label: 'Mutasi Stok', icon: Repeat2 },
  ]

  if (loading) {
    return (
      <div className="font-admin flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-8 w-8 text-admin-accent admin-spin" />
        <p className="m-0 text-sm text-admin-ink-muted">Memuat data toko...</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="py-10">
        <ErrorPage 
          title="Toko Tidak Ditemukan" 
          message={fetchError.message} 
          code={fetchError.code} 
        />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="font-admin py-20 text-center">
        <p className="text-admin-ink-muted">Toko tidak ditemukan</p>
      </div>
    )
  }

  const storeMetrics = [
    {
      label: 'Radius Layanan',
      value: `${store.serviceRadius} km`,
      Icon: Radar,
    },
    {
      label: 'Admin Cabang',
      value: `${store._count?.admins ?? store.admins?.length ?? 0} admin`,
      Icon: Users,
    },
    {
      label: 'Kontak',
      value: store.phone || 'Belum diisi',
      Icon: Phone,
    },
  ]

  return (
    <div className="font-admin">
      <section className="mb-5 rounded-3xl border border-admin-line-soft bg-admin-surface p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <span className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${store.status ? 'bg-admin-green-soft text-admin-green' : 'bg-admin-red-soft text-admin-red'}`}>
              {store.status ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}
              {store.status ? 'Aktif' : 'Nonaktif'}
            </span>
            <h3 className="m-0 truncate text-2xl font-bold text-admin-ink">{store.name}</h3>
            <p className="m-0 mt-2 flex max-w-3xl items-start gap-2 text-sm leading-6 text-admin-ink-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-admin-accent-strong" />
              <span className="wrap-break-word">{store.address}, {store.city}, {store.province}</span>
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 xl:w-[560px]">
            {storeMetrics.map((metric) => {
              const Icon = metric.Icon

              return (
                <div key={metric.label} className="min-w-0 rounded-2xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
                  <div className="mb-2 flex items-center gap-2 text-admin-ink-muted">
                    <Icon className="h-4 w-4 text-admin-accent-strong" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">{metric.label}</span>
                  </div>
                  <strong className="block truncate text-sm text-admin-ink">{metric.value}</strong>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="admin-table-wrap mb-6 max-w-full overflow-x-auto pb-1">
        <div className="flex w-max min-w-full gap-2 rounded-2xl border border-admin-line-soft bg-admin-surface p-1.5 shadow-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex min-w-max cursor-pointer items-center gap-2 rounded-xl border-none px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-admin-accent text-white shadow-sm'
                    : 'bg-transparent text-admin-ink-soft hover:bg-admin-surface-2 hover:text-admin-ink'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="admin-fade-in" key={activeTab}>
        {activeTab === 'details' && (
          <AdminStoreDetailsForm
            formData={formData}
            position={position}
            saving={saving}
            setFormData={setFormData}
            setPosition={setPosition}
            onSubmit={handleUpdateStore}
          />
        )}

        {activeTab === 'stocks' && <AdminStockList storeId={Number(id)} />}
        {activeTab === 'discounts' && <AdminDiscountList storeId={Number(id)} />}
        {activeTab === 'orders' && <AdminOrderList storeId={Number(id)} />}
        {activeTab === 'fulfillment' && (
          <AdminStoreFulfillmentPage storeId={Number(id)} onOpenOrders={() => setActiveTab('orders')} />
        )}
      </div>
    </div>
  )
}