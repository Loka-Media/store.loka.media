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
      return `${baseClasses} bg-gray-700/30 text-gray-500`;
    }

    switch (color) {
      case 'blue':
        return `${baseClasses} bg-blue-900/30 text-blue-400`;
      case 'yellow':
        return `${baseClasses} bg-yellow-900/30 text-yellow-400`;
      case 'orange':
        return `${baseClasses} bg-orange-900/30 text-orange-400`;
      case 'purple':
        return `${baseClasses} bg-purple-900/30 text-purple-400`;
      case 'green':
        return `${baseClasses} bg-green-900/30 text-green-400`;
      default:
        return `${baseClasses} bg-gray-700/30 text-gray-400`;
    }
  };

  const getTextColor = (color: string, isActive: boolean) => {
    if (!isActive) return 'text-gray-500';

    switch (color) {
      case 'blue':
        return 'text-blue-300';
      case 'yellow':
        return 'text-yellow-300';
      case 'orange':
        return 'text-orange-300';
      case 'purple':
        return 'text-purple-300';
      case 'green':
        return 'text-green-300';
      default:
        return 'text-gray-300';
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
                    )} ${isCurrent(index) ? 'ring-2 ring-offset-2 ring-offset-black' + (stage.color === 'blue' ? ' ring-blue-400' : stage.color === 'yellow' ? ' ring-yellow-400' : stage.color === 'orange' ? ' ring-orange-400' : ' ring-gray-400') : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`mt-2 text-xs font-medium whitespace-nowrap ${getTextColor(stage.color, isActive)}`}>
                    {stage.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                    {stage.description}
                  </div>
                </div>

                {/* Arrow to next stage */}
                {index < stages.length - 1 && (
                  <div className="mx-1 md:mx-3">
                    <ArrowRight
                      className={`w-4 h-4 ${
                        index < currentStageIndex
                          ? 'text-green-400'
                          : 'text-gray-600'
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
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 font-medium">Order Status</div>
          <div className={`text-sm font-semibold mt-1 ${
            orderStatus === 'pending' ? 'text-gray-300' :
            orderStatus === 'payment_received' ? 'text-blue-300' :
            orderStatus === 'verified' ? 'text-yellow-300' :
            orderStatus === 'processing' ? 'text-orange-300' :
            orderStatus === 'fulfilled' ? 'text-purple-300' :
            'text-green-300'
          }`}>
            {orderStatus.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 font-medium">Payment Status</div>
          <div className={`text-sm font-semibold mt-1 ${
            paymentStatus === 'pending' ? 'text-gray-300' :
            paymentStatus === 'completed' ? 'text-green-300' :
            paymentStatus === 'released' ? 'text-blue-300' :
            'text-yellow-300'
          }`}>
            {paymentStatus.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>

        {printfulStatus && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400 font-medium">Printful Status</div>
            <div className={`text-sm font-semibold mt-1 ${
              printfulStatus === 'processing' ? 'text-orange-300' :
              printfulStatus === 'shipped' ? 'text-purple-300' :
              printfulStatus === 'delivered' ? 'text-green-300' :
              'text-gray-300'
            }`}>
              {printfulStatus.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
