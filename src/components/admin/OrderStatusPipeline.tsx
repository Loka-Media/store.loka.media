import {
  Clock,
  CheckCircle,
  DollarSign,
  AlertCircle,
  Printer,
  Truck,
  CheckCheck,
  ArrowRight
} from 'lucide-react';

interface OrderStatusPipelineProps {
  orderStatus: string;
  paymentStatus: string;
  printfulStatus?: string;
}

export const OrderStatusPipeline = ({
  orderStatus,
  paymentStatus,
  printfulStatus
}: OrderStatusPipelineProps) => {
  const stages = [
    {
      key: 'pending',
      label: 'Order Placed',
      icon: Clock,
      color: 'gray',
      description: 'Waiting for payment'
    },
    {
      key: 'payment_received',
      label: 'Payment Received',
      icon: DollarSign,
      color: 'blue',
      description: 'Payment confirmed'
    },
    {
      key: 'verified',
      label: 'Verified',
      icon: AlertCircle,
      color: 'yellow',
      description: 'Admin verified'
    },
    {
      key: 'processing',
      label: 'Processing',
      icon: Printer,
      color: 'orange',
      description: 'Being produced'
    },
    {
      key: 'fulfilled',
      label: 'Shipped',
      icon: Truck,
      color: 'purple',
      description: 'In transit'
    },
    {
      key: 'delivered',
      label: 'Delivered',
      icon: CheckCheck,
      color: 'green',
      description: 'Order complete'
    }
  ];

  const getStageIndex = (status: string) => {
    return stages.findIndex(s => s.key === status || status.includes(s.key));
  };

  const currentStageIndex = getStageIndex(orderStatus);
  const isCompleted = (index: number) => index <= currentStageIndex;
  const isCurrent = (index: number) => index === currentStageIndex;

  const getColorClasses = (color: string, isActive: boolean) => {
    const baseClasses = 'rounded-full p-3 transition-all duration-300';

    if (!isActive) {
      return `${baseClasses} bg-slate-100 text-slate-400`;
    }

    switch (color) {
      case 'blue':
        return `${baseClasses} bg-blue-100 text-blue-600`;
      case 'yellow':
        return `${baseClasses} bg-yellow-100 text-yellow-600`;
      case 'orange':
        return `${baseClasses} bg-orange-100 text-orange-600`;
      case 'purple':
        return `${baseClasses} bg-purple-100 text-purple-600`;
      case 'green':
        return `${baseClasses} bg-green-100 text-green-600`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-400`;
    }
  };

  const getTextColor = (color: string, isActive: boolean) => {
    if (!isActive) return 'text-slate-500';

    switch (color) {
      case 'blue':
        return 'text-blue-700';
      case 'yellow':
        return 'text-yellow-700';
      case 'orange':
        return 'text-orange-700';
      case 'purple':
        return 'text-purple-700';
      case 'green':
        return 'text-green-700';
      default:
        return 'text-slate-700';
    }
  };

  return (
    <div className="w-full">
      {/* Status Pipeline */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-center gap-2 min-w-max px-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = isCompleted(index);
            const isCurrentStage = isCurrent(index);

            return (
              <div key={stage.key} className="flex items-center">
                {/* Stage Circle */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`${getColorClasses(
                      stage.color,
                      isActive
                    )} ${isCurrent(index) ? 'ring-2 ring-offset-2 ring-offset-white' + (stage.color === 'blue' ? ' ring-blue-500' : stage.color === 'yellow' ? ' ring-yellow-500' : stage.color === 'orange' ? ' ring-orange-500' : ' ring-slate-400') : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`mt-2 text-xs font-semibold whitespace-nowrap ${getTextColor(stage.color, isActive)}`}>
                    {stage.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 whitespace-nowrap">
                    {stage.description}
                  </div>
                </div>

                {/* Arrow to next stage */}
                {index < stages.length - 1 && (
                  <div className="mx-1 md:mx-3">
                    <ArrowRight
                      className={`w-4 h-4 ${
                        index < currentStageIndex
                          ? 'text-green-600'
                          : 'text-slate-300'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/60 rounded-lg p-3">
          <div className="text-xs text-slate-600 font-semibold">Order Status</div>
          <div className={`text-sm font-bold mt-1 ${
            orderStatus === 'pending' ? 'text-slate-700' :
            orderStatus === 'payment_received' ? 'text-blue-700' :
            orderStatus === 'verified' ? 'text-yellow-700' :
            orderStatus === 'processing' ? 'text-orange-700' :
            orderStatus === 'fulfilled' ? 'text-purple-700' :
            'text-green-700'
          }`}>
            {orderStatus.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/60 rounded-lg p-3">
          <div className="text-xs text-slate-600 font-semibold">Payment Status</div>
          <div className={`text-sm font-bold mt-1 ${
            paymentStatus === 'pending' ? 'text-slate-700' :
            paymentStatus === 'completed' ? 'text-green-700' :
            paymentStatus === 'released' ? 'text-blue-700' :
            'text-yellow-700'
          }`}>
            {paymentStatus.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>

        {printfulStatus && (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/60 rounded-lg p-3">
            <div className="text-xs text-slate-600 font-semibold">Printful Status</div>
            <div className={`text-sm font-bold mt-1 ${
              printfulStatus === 'processing' ? 'text-orange-700' :
              printfulStatus === 'shipped' ? 'text-purple-700' :
              printfulStatus === 'delivered' ? 'text-green-700' :
              'text-slate-700'
            }`}>
              {printfulStatus.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
