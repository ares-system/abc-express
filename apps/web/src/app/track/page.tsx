'use client';

import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Package, Clock, CheckCircle } from 'lucide-react';
import { PageLoading } from '@/components/ui/feedback';

interface TrackedShipment {
  id: string;
  connoteNumber: string;
  status: string;
  weightKg: number;
  volumeM3: number;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  originBranch: { name: string; city: string; region: string };
  destinationBranch: { name: string; city: string; region: string };
  events: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    branch: { name: string; city: string } | null;
  }>;
}

export default function TrackingPage() {
  const [connote, setConnote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shipment, setShipment] = useState<TrackedShipment | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connote.trim()) return;

    setLoading(true);
    setError('');
    setShipment(null);

    try {
      const res = await fetch(`/api/track/${encodeURIComponent(connote.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to track shipment');
      }

      setShipment(data.data);
    } catch (err: any) {
      setError(err.message || 'Tracking failed. Please check your AWB number.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PICKED_UP': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'IN_TRANSIT': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'AT_HUB': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'EXCEPTION': return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-900 text-white py-6">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center space-x-3 mb-8">
            <Package className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">ABC Express</h1>
          </div>
          
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold mb-2">Track Your Shipment</h2>
            <p className="text-indigo-200 mb-6">Enter your Air Waybill (AWB) or Connote Number to get real-time status.</p>
            
            <form onSubmit={handleTrack} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="e.g., ABC2026101234567"
                  className="pl-10 h-12 text-lg text-gray-900 bg-white"
                  value={connote}
                  onChange={(e) => setConnote(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-700" disabled={loading || !connote.trim()}>
                {loading ? 'Tracking...' : 'Track'}
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {loading && <div className="py-12"><PageLoading /></div>}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg shadow-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Error</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {shipment && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Shipment Header */}
            <Card padding="lg">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">AWB Number</p>
                    <h3 className="text-2xl font-bold font-mono text-gray-900">{shipment.connoteNumber}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(shipment.status)}`}>
                      {shipment.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Origin</p>
                        <p className="font-semibold text-gray-900">{shipment.originBranch.city}</p>
                        <p className="text-sm text-gray-600">{shipment.originBranch.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Destination</p>
                        <p className="font-semibold text-gray-900">{shipment.destinationBranch.city}</p>
                        <p className="text-sm text-gray-600">{shipment.destinationBranch.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Delivery Status</p>
                        {shipment.actualDeliveryDate ? (
                          <>
                            <p className="font-semibold text-gray-900">Delivered</p>
                            <p className="text-sm text-gray-600">
                              {new Date(shipment.actualDeliveryDate).toLocaleDateString('en-ID', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </>
                        ) : shipment.estimatedDeliveryDate ? (
                          <>
                            <p className="font-semibold text-gray-900">Estimated</p>
                            <p className="text-sm text-gray-600">
                              {new Date(shipment.estimatedDeliveryDate).toLocaleDateString('en-ID', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </p>
                          </>
                        ) : (
                          <p className="font-semibold text-gray-900">Pending Estimate</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
            </Card>

            {/* Tracking Timeline */}
            <Card padding="none">
              <CardHeader title="Tracking History" className="border-b border-gray-100 bg-gray-50/50 p-6" />
              <div className="p-6">
                {shipment.events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tracking events recorded yet.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pb-4 mt-2">
                    {shipment.events.map((event, index) => {
                      const isFirst = index === 0;
                      return (
                        <div key={event.id} className="relative pl-8">
                          <div className={`absolute -left-2.5 top-1.5 w-5 h-5 rounded-full border-4 border-white ${isFirst ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-1">
                            <h4 className={`font-semibold ${isFirst ? 'text-indigo-700' : 'text-gray-900'}`}>
                              {event.type.replace(/_/g, ' ')}
                            </h4>
                            <span className="text-sm text-gray-500 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-md font-mono">
                              {new Date(event.timestamp).toLocaleString('en-ID', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-1">{event.description}</p>
                          {event.branch && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.branch.name}, {event.branch.city}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="container mx-auto px-4 max-w-4xl text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} ABC Express. AIP Public Track & Trace.</p>
        </div>
      </footer>
    </div>
  );
}
